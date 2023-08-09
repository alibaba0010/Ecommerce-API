declare global {
   namespace NodeJS {
     interface Global {
       signin(): Promise<string[]>; //aditional property
     }
   }
 }