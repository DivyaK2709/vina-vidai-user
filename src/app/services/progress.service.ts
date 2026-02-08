import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  async saveTestProgress(data: any) {

    const user = this.auth.currentUser;

    if (!user) throw new Error('User not logged in');

    const ref = collection(
      this.firestore,
      `users/${user.uid}/testProgress`
    );

    return addDoc(ref, {
      ...data,
      timestamp: new Date()
    });
  }
}
