import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastCtrl: ToastController) {}

  async show(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'success', // ✅ second argument
    duration: number = 2200                                          // ✅ third argument
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      cssClass: 'custom-toast',
      color: color // will be overridden in shadow DOM if needed
    });

    await toast.present();

    setTimeout(() => {
      const toastEl = toast as any;
      const wrapper = toastEl?.overlay?.shadowRoot?.querySelector('.toast-wrapper');
      const msg = toastEl?.overlay?.shadowRoot?.querySelector('.toast-message');

      if (wrapper) {
        wrapper.setAttribute(
          'style',
          'background-color: green !important; border-radius: 10px;'
        );
      }
      if (msg) {
        msg.setAttribute(
          'style',
          'color: white !important; font-weight: 600; text-align: center;'
        );
      }
    }, 50);
  }
}
