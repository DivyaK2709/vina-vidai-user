import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private styleInjected = false;

  constructor(private toastCtrl: ToastController) {}

  async show(
    message: string,
    type: 'success' | 'warning' | 'danger' | 'primary' = 'success',
    duration: number = 2200
  ) {

    this.injectToastStyles(); // ✅ runtime-only CSS

    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      cssClass: `app-toast app-toast-${type}`
    });

    await toast.present();
  }

  // 🔥 Injected ONCE – NOT global CSS file
  private injectToastStyles() {
    if (this.styleInjected) return;

    const style = document.createElement('style');
    style.innerHTML = `
      ion-toast.app-toast {
        --color: #ffffff;
        --border-radius: 12px;
        font-weight: 600;
        text-align: center;
      }

      ion-toast.app-toast-success {
        --background: #0f766e; /* light green theme */
      }

      ion-toast.app-toast-warning {
        --background: green;
      }

      ion-toast.app-toast-danger {
        --background: #dc2626;
      }

      ion-toast.app-toast-primary {
        --background: #2563eb;
      }
    `;

    document.head.appendChild(style);
    this.styleInjected = true;
  }
}
