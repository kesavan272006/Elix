import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

class ActionService {
  constructor() {
    this.setupNotifications();
  }

  private async setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  async openApp(appName: string): Promise<boolean> {
    const appUrls: Record<string, string> = {
      whatsapp: 'whatsapp://',
      chrome: 'googlechrome://',
      maps: 'maps://',
      mail: 'mailto:',
      // Add more apps as needed
    };

    const url = appUrls[appName.toLowerCase()];
    if (!url) {
      throw new Error(`App ${appName} not supported`);
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opening app:', error);
      return false;
    }
  }

  async openWebsite(url: string): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opening website:', error);
      return false;
    }
  }

  async setReminder(text: string, time: Date): Promise<string> {
    try {
      const trigger = new Date(time);
      
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ELIX Reminder',
          body: text,
          sound: true,
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('Error setting reminder:', error);
      throw error;
    }
  }

  async cancelReminder(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling reminder:', error);
      throw error;
    }
  }
}

export const actionService = new ActionService(); 