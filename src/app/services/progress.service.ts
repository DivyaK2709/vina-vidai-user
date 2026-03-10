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

  const user = await new Promise<any>((resolve) => {
    const unsub = this.auth.onAuthStateChanged(u => {
      unsub();
      resolve(u);
    });
  });

  if (!user) {
    console.error("User not logged in");
    return;
  }

  const ref = collection(
    this.firestore,
    `users/${user.uid}/testProgress`
  );

  return addDoc(ref, {
    ...data,
    timestamp: new Date()
  });
}}
