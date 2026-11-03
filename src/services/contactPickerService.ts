import { Capacitor, registerPlugin } from '@capacitor/core';

export interface ContactPhone {
  number: string;
  type: string;
}

export interface PickedContact {
  name: string;
  phoneNumber: string;
  phoneType?: string;
  allPhones: ContactPhone[];
}

export interface ContactPickerResult {
  success: boolean;
  contact?: PickedContact;
  cancelled?: boolean;
  error?: string;
}

interface NativeContactPickerPlugin {
  pickContact(): Promise<{
    name: string;
    phoneNumber: string;
    phoneType?: string;
    allPhones?: { number: string; type: string }[];
  }>;
}

const NativeContactPicker = registerPlugin<NativeContactPickerPlugin>('ContactPicker');

export async function pickContactFromDevice(): Promise<ContactPickerResult> {
  // 1. Android Native platform via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeContactPicker.pickContact();
      const allPhones: ContactPhone[] = Array.isArray(res.allPhones) && res.allPhones.length > 0
        ? res.allPhones
        : [{ number: res.phoneNumber, type: res.phoneType || 'Mobile' }];

      return {
        success: true,
        contact: {
          name: res.name || '',
          phoneNumber: res.phoneNumber || '',
          phoneType: res.phoneType || 'Mobile',
          allPhones
        }
      };
    } catch (err: any) {
      const message = err?.message || String(err);
      if (message.toLowerCase().includes('cancel')) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: message };
    }
  }

  // 2. Web Standards Contact Picker API fallback (Chrome / Edge on Android Web)
  if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator as any).contacts) {
    try {
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
      if (contacts && contacts.length > 0) {
        const c = contacts[0];
        const name = (c.name && c.name[0]) ? c.name[0] : '';
        const rawPhones: string[] = (c.tel && Array.isArray(c.tel)) ? c.tel : [];
        const primaryPhone = rawPhones[0] || '';

        const allPhones: ContactPhone[] = rawPhones.map((num: string, idx: number) => ({
          number: num,
          type: idx === 0 ? 'Primary' : 'Alternative'
        }));

        if (allPhones.length === 0 && primaryPhone) {
          allPhones.push({ number: primaryPhone, type: 'Mobile' });
        }

        return {
          success: true,
          contact: {
            name,
            phoneNumber: primaryPhone,
            phoneType: 'Mobile',
            allPhones
          }
        };
      }
      return { success: false, cancelled: true };
    } catch (err: any) {
      const message = err?.message || String(err);
      if (message.toLowerCase().includes('cancel')) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: message };
    }
  }

  // 3. Fallback when not supported
  return {
    success: false,
    error: 'Contact picker is only available on Android devices or supported mobile browsers. Please enter contact details manually.'
  };
}

