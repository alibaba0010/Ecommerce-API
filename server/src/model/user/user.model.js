export class UserModel {
   constructor(){}
   confirmPassword(password, confirmPassword){
      console.log("In model");
      if (password !== confirmPassword)
      throw new BadRequestError("Password doesn't match");
  
   }
}