import axios from 'axios';
import { config } from '../config/env';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export async function fetchMediaUrl(mediaId: string): Promise<string> {
  try {
    const response = await axios.get(`${WHATSAPP_API_URL}/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
      },
    });

    return response.data.url;
  } catch (error) {
    console.error('Error fetching media URL:', error);
    throw new Error('Failed to fetch media URL');
  }
}

export async function downloadMedia(mediaUrl: string): Promise<Buffer> {
  try {
    const response = await axios.get(mediaUrl, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading media:', error);
    throw new Error('Failed to download media');
  }
}

export async function sendTextMessage(
  to: string,
  message: string
): Promise<void> {
  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${config.whatsapp.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

export async function getBusinessProfile(): Promise<any> {
  try {
    const response = await axios.get(
      `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/whatsapp_business_profile`,
      {
        headers: {
          Authorization: `Bearer ${config.whatsapp.accessToken}`,
        },
        params: {
          fields: 'about,address,description,email,profile_picture_url,websites,vertical',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching business profile:', error);
    throw new Error('Failed to fetch business profile');
  }
}
