// backend/src/emails/imap.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Email, EmailDocument } from './email.schema';

@Injectable()
export class ImapService implements OnModuleInit {
  private readonly logger = new Logger(ImapService.name);
  private imap: Imap;

  private readonly TEST_SUBJECT = process.env.TEST_EMAIL_SUBJECT || '';
  private readonly POLL_MS = Number(process.env.IMAP_POLL_MS || 30_000); // not used by node-imap flow but left for reference

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
  ) {
    this.imap = new Imap({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST,
      port: Number(process.env.IMAP_PORT) || 993,
      tls: process.env.IMAP_SECURE !== 'false',
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 30000,
    });
  }

  onModuleInit() {
    this.connect();
  }

  private connect() {
    this.imap.once('ready', () => {
      this.logger.log('IMAP connected');
      this.openInbox();
    });

    this.imap.once('error', (err) => {
      this.logger.error('IMAP error: ' + (err && err.message));
    });

    this.imap.once('end', () => {
      this.logger.warn('IMAP connection ended — will try reconnect in 10s');
      setTimeout(() => this.imap.connect(), 10000);
    });

    this.imap.connect();
  }

  private openInbox() {
    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        this.logger.error('Open inbox error: ' + err.message);
        return;
      }
      this.logger.log(`INBOX opened. Messages total: ${box.messages.total}`);
      // Start searching immediately and also listen for new mail
      this.searchForTestEmails();
      // Use IDLE/new mail notifications to fetch immediately
      this.imap.on('mail', () => {
        this.logger.log('New mail event from server — searching for test emails');
        this.searchForTestEmails();
      });
    });
  }

  // Normalize a header-lines array into an array of server names/hops
  private normalizeReceivingChain(headerLines: { key: string; line: string }[] = []): string[] {
    if (!Array.isArray(headerLines)) return [];

    const recvLines = headerLines
      .filter(h => h && h.key && h.key.toLowerCase() === 'received')
      .map(h => h.line);

    const cleaned = recvLines.map((line) => {
      // Try "from <server> (" pattern
      let m = line.match(/from\s+([^\s\(\[\;]+)/i);
      if (m && m[1]) return m[1];

      // Try "by <server>" pattern
      m = line.match(/by\s+([^\s\(\[\;]+)/i);
      if (m && m[1]) return m[1];

      // fallback: pick first hostname-looking token
      m = line.match(/([a-z0-9\-\._]+\.[a-z]{2,})/i);
      if (m && m[1]) return m[1];

      // final fallback: raw line trimmed
      return line.replace(/\s+/g, ' ').trim();
    });

    // Remove duplicates but keep order:
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of cleaned) {
      if (!s) continue;
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
    return out;
  }

  // Detect ESP using from-address and received chain text
  private detectESPFromData(fromAddress: string, receivingChain: string[], rawHeadersText = ''): string {
    const candidates: { name: string; score: number }[] = [];
    const text = [fromAddress, ...receivingChain, rawHeadersText].join(' ').toLowerCase();

    const push = (n: string, s = 0.9) => candidates.push({ name: n, score: s });

    // Known providers
    if (text.includes('amazonses') || text.includes('amazonaws')) push('Amazon SES', 0.99);
    if (text.includes('sendgrid')) push('SendGrid', 0.99);
    if (text.includes('mailgun')) push('Mailgun', 0.99);
    if (text.includes('postmark')) push('Postmark', 0.98);
    if (text.includes('mandrill') || text.includes('mailchimp')) push('Mailchimp', 0.97);
    if (text.includes('sparkpost')) push('SparkPost', 0.97);
    if (text.includes('sendinblue')) push('Sendinblue', 0.96);
    if (text.includes('zoho')) push('Zoho Mail', 0.94);
    if (text.includes('google') || text.includes('gmail.com')) push('Gmail / Google', 0.93);
    if (text.includes('outlook') || text.includes('office365') || text.includes('microsoft')) push('Outlook / Microsoft 365', 0.93);
    if (text.includes('yahoo')) push('Yahoo Mail', 0.9);

    // Domain fallback from fromAddress
    const m = (fromAddress || '').match(/@([a-z0-9\-\._]+)$/i);
    if (m && m[1]) push(m[1], 0.5);

    if (candidates.length === 0) return 'Unknown';
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].name;
  }

  // Core: search & fetch test emails (or unseen if TEST_SUBJECT empty)
  private searchForTestEmails() {
    // Build IMAP search criteria
    const subject = this.TEST_SUBJECT && this.TEST_SUBJECT.trim().length ? ['HEADER', 'SUBJECT', this.TEST_SUBJECT] : null;
    // const crit = subject ? ['UNSEEN', subject] : ['UNSEEN'];
   const crit = this.TEST_SUBJECT && this.TEST_SUBJECT.trim().length
  ? ['UNSEEN', ['HEADER', 'SUBJECT', this.TEST_SUBJECT]]
  : ['UNSEEN'];

  this.logger.log(`Searching IMAP with criteria: ${JSON.stringify(crit)}`);

    this.imap.search(crit, (err, results) => {
      if (err) {
        this.logger.error('Search error: ' + err.message);
        return;
      }
      if (!results || results.length === 0) {
        this.logger.log('No matching unseen emails found');
        return;
      }

      this.logger.log(`Found ${results.length} matching UIDs: ${results.join(',')}`);

      const f = this.imap.fetch(results, { bodies: '', markSeen: true });
      f.on('message', (msg, seqno) => {
        let uidVal: number | undefined = undefined;

        msg.on('attributes', attrs => {
          if (attrs && attrs.uid) uidVal = attrs.uid;
        });

        msg.on('body', async (stream) => {
          try {
            const parsed = await simpleParser(stream);

            // get canonical from address (email only)
            const fromAddress = parsed.from?.value?.[0]?.address || parsed.from?.text || '';

            // normalize receiving chain using headerLines
            const receivingChain = this.normalizeReceivingChain(parsed.headerLines || []);

            // raw header text fallback
            const rawHeadersText = (parsed.headerLines || []).map(h => h.line).join('\n');

            const esp = this.detectESPFromData(fromAddress, receivingChain, rawHeadersText);

            const doc = {
              subject: parsed.subject || '(no subject)',
              from: parsed.from?.text || '',
              to: parsed.to?.text || '',
              date: parsed.date || new Date(),
              text: parsed.text || parsed.html || '',
              receivingChain,
              esp,
              uid: uidVal,
            };

            await this.emailModel.create(doc);
            this.logger.log(`Saved email (UID ${uidVal}) subject="${doc.subject}" esp=${esp}`);
          } catch (e) {
            this.logger.error('Error parsing/fetching message: ' + (e && e.message));
          }
        });
      });

      f.once('error', (err) => {
        this.logger.error('Fetch error: ' + (err && err.message));
      });

      f.once('end', () => {
        this.logger.log('Fetch end');
      });
    });
  }

  // API helper: get latest emails
    // API helper: get latest emails with pagination and optional esp filter
  async getLatest(limit = 20, page = 1, esp?: string) {
  const q: any = {};

  // Always filter by test subject if set
  if (this.TEST_SUBJECT && this.TEST_SUBJECT.trim().length) {
    q.subject = this.TEST_SUBJECT;
  }

  // Optionally filter by ESP
  if (esp && typeof esp === 'string' && esp.trim().length) {
    q.esp = esp;
  }

  const skip = (page - 1) * limit;
  const docs = await this.emailModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();
  const total = await this.emailModel.countDocuments(q).exec();
  return { items: docs, total, page, limit };
}



  async getById(id: string) {
    return this.emailModel.findById(id).lean().exec();
  }

  // test-config
  getTestConfig() {
    return {
      testAddress: process.env.TEST_EMAIL_ADDRESS || process.env.IMAP_USER,
      subject: process.env.TEST_EMAIL_SUBJECT || '',
    };
  }
}
