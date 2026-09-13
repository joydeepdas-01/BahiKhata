export type ToneKey = 'pre_due' | 'due_today' | 'overdue' | 'final';
export type LanguageKey = 'en' | 'hi' | 'bn';

export interface Template {
  toneKey: ToneKey;
  language: LanguageKey;
  text: string;
}

export const DEFAULT_TEMPLATES: Template[] = [
  // English
  {
    toneKey: 'pre_due',
    language: 'en',
    text: 'Hello {{name}}, this is a gentle reminder that your pending balance of {{amount}}{{reason}} is due on {{due_date}}. Thank you!'
  },
  {
    toneKey: 'due_today',
    language: 'en',
    text: 'Hello {{name}}, this is to remind you that your payment of {{amount}}{{reason}} is due today ({{due_date}}). Kindly clear it at your earliest convenience. Thank you.'
  },
  {
    toneKey: 'overdue',
    language: 'en',
    text: 'Hello {{name}}, your payment of {{amount}}{{reason}} was due on {{due_date}} and is now overdue. Please clear the pending dues as soon as possible. Thank you.'
  },
  {
    toneKey: 'final',
    language: 'en',
    text: 'Hello {{name}}, this is a final notice regarding your outstanding balance of {{amount}}{{reason}} which was due on {{due_date}}. Please process the payment immediately to clear your accounts. Thank you.'
  },
  // Hindi
  {
    toneKey: 'pre_due',
    language: 'hi',
    text: 'नमस्ते {{name}}, यह एक विनम्र अनुस्मारक है कि आपकी {{amount}} की लंबित राशि{{reason}} {{due_date}} को देय है। धन्यवाद!'
  },
  {
    toneKey: 'due_today',
    language: 'hi',
    text: 'नमस्ते {{name}}, आपको याद दिलाना है कि आपकी {{amount}} की भुगतान राशि{{reason}} आज ({{due_date}}) देय है। कृपया जल्द से जल्द इसका भुगतान करें। धन्यवाद।'
  },
  {
    toneKey: 'overdue',
    language: 'hi',
    text: 'नमस्ते {{name}}, आपकी {{amount}} की भुगतान राशि{{reason}} {{due_date}} को देय थी और अब अतिदेय (overdue) हो गई है। कृपया लंबित राशि का जल्द से जल्द भुगतान करें। धन्यवाद।'
  },
  {
    toneKey: 'final',
    language: 'hi',
    text: 'नमस्ते {{name}}, यह आपके बकाया {{amount}}{{reason}} के संबंध में अंतिम सूचना है जो {{due_date}} को देय थी। कृपया तुरंत भुगतान करके अपना खाता स्पष्ट करें। धन्यवाद।'
  },
  // Bengali
  {
    toneKey: 'pre_due',
    language: 'bn',
    text: 'নমস্কার {{name}}, এটি একটি মৃদু অনুস্মারক যে আপনার {{amount}} টাকার বকেয়া বিলটি{{reason}} {{due_date}} তারিখে পরিশোধ করার কথা। ধন্যবাদ!'
  },
  {
    toneKey: 'due_today',
    language: 'bn',
    text: 'নমস্কার {{name}}, আপনাকে মনে করিয়ে দেওয়া হচ্ছে যে আপনার {{amount}} টাকার বকেয়া বিলটি{{reason}} আজ ({{due_date}}) পরিশোধ করার তারিখ। অনুগ্রহ করে আজ পরিশোধ করে দিন। ধন্যবাদ।'
  },
  {
    toneKey: 'overdue',
    language: 'bn',
    text: 'নমস্কার {{name}}, আপনার {{amount}} টাকার বিলটি{{reason}} {{due_date}} তারিখে পরিশোধ করার কথা ছিল যা বর্তমানে বকেয়া (overdue) রয়েছে। অনুগ্রহ করে বকেয়া টাকাটি দ্রুত পরিশোধ করুন। ধন্যবাদ।'
  },
  {
    toneKey: 'final',
    language: 'bn',
    text: 'নমস্কার {{name}}, এটি আপনার বকেয়া {{amount}} টাকার{{reason}} চূড়ান্ত নোটিশ যা {{due_date}} তারিখে পরিশোধ করার কথা ছিল। অনুগ্রহ করে অবিলম্বে অর্থ পরিশোধ করে আপনার অ্যাকাউন্ট পরিষ্কার করুন। ধন্যবাদ।'
  }
];

export function parseTemplate(
  templateText: string, 
  placeholders: { name: string; amount: string; dueDate: string; reason?: string; language?: LanguageKey }
): string {
  const lang = placeholders.language || 'en';
  let formattedReason = '';

  if (placeholders.reason && placeholders.reason.trim()) {
    const cleanReason = placeholders.reason.trim();
    if (lang === 'hi') {
      formattedReason = ` ("${cleanReason}" के लिए)`;
    } else if (lang === 'bn') {
      formattedReason = ` ("${cleanReason}"-এর জন্য)`;
    } else {
      formattedReason = ` for "${cleanReason}"`;
    }
  }

  let result = templateText
    .replace(/\{\{\s*name\s*\}\}/g, placeholders.name)
    .replace(/\{\{\s*amount\s*\}\}/g, placeholders.amount)
    .replace(/\{\{\s*due_date\s*\}\}/g, placeholders.dueDate)
    .replace(/\{\{\s*reason\s*\}\}/g, formattedReason)
    .replace(/\{\{\s*note\s*\}\}/g, formattedReason);

  // If the template text did not contain {{reason}} or {{note}} placeholder, append the reason explicitly
  const hasReasonTag = /\{\{\s*(reason|note)\s*\}\}/i.test(templateText);
  if (!hasReasonTag && formattedReason) {
    result += ` (Reason:${formattedReason})`;
  }

  return result;
}
