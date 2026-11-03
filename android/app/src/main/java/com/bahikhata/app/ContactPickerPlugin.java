package com.bahikhata.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ContactPicker")
public class ContactPickerPlugin extends Plugin {

    @PluginMethod
    public void pickContact(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
        startActivityForResult(call, intent, "pickContactResult");
    }

    @ActivityCallback
    private void pickContactResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Contact selection cancelled");
            return;
        }

        Uri contactUri = result.getData().getData();
        if (contactUri == null) {
            call.reject("No contact data returned");
            return;
        }

        ContentResolver contentResolver = getContext().getContentResolver();
        String[] projection = new String[]{
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE
        };

        try (Cursor cursor = contentResolver.query(contactUri, projection, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int idIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
                int nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int typeIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE);

                String contactId = idIdx != -1 ? cursor.getString(idIdx) : null;
                String displayName = nameIdx != -1 ? cursor.getString(nameIdx) : "";
                String selectedNumber = numIdx != -1 ? cursor.getString(numIdx) : "";
                int phoneTypeInt = typeIdx != -1 ? cursor.getInt(typeIdx) : ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE;
                String phoneTypeLabel = (String) ContactsContract.CommonDataKinds.Phone.getTypeLabel(
                    getContext().getResources(), phoneTypeInt, "Mobile"
                );

                JSObject ret = new JSObject();
                ret.put("name", displayName);
                ret.put("phoneNumber", selectedNumber);
                ret.put("phoneType", phoneTypeLabel);

                // Fetch any alternative phone numbers for this specific contact
                JSArray allNumbers = new JSArray();
                JSObject primary = new JSObject();
                primary.put("number", selectedNumber);
                primary.put("type", phoneTypeLabel);
                allNumbers.put(primary);

                if (contactId != null) {
                    String[] phoneProj = new String[]{
                        ContactsContract.CommonDataKinds.Phone.NUMBER,
                        ContactsContract.CommonDataKinds.Phone.TYPE
                    };
                    String selection = ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?";
                    String[] selArgs = new String[]{ contactId };

                    try (Cursor phoneCursor = contentResolver.query(
                        ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                        phoneProj, selection, selArgs, null)) {
                        
                        if (phoneCursor != null) {
                            int pNumIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                            int pTypeIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE);

                            while (phoneCursor.moveToNext()) {
                                String num = pNumIdx != -1 ? phoneCursor.getString(pNumIdx) : "";
                                int tInt = pTypeIdx != -1 ? phoneCursor.getInt(pTypeIdx) : ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE;
                                String tLabel = (String) ContactsContract.CommonDataKinds.Phone.getTypeLabel(
                                    getContext().getResources(), tInt, "Mobile"
                                );

                                if (num != null && !num.isEmpty() && !num.equals(selectedNumber)) {
                                    JSObject item = new JSObject();
                                    item.put("number", num);
                                    item.put("type", tLabel);
                                    allNumbers.put(item);
                                }
                            }
                        }
                    } catch (Exception ignored) {
                        // If secondary query fails, we gracefully continue with primary number
                    }
                }

                ret.put("allPhones", allNumbers);
                call.resolve(ret);
            } else {
                call.reject("Unable to read selected contact details");
            }
        } catch (Exception e) {
            call.reject("Error reading contact: " + e.getMessage());
        }
    }
}

