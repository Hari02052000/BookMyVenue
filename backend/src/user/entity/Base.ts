import { ValidationError } from "@src/shared/errors";

export abstract class Base{
    createdAt:Date
    updatedAt:Date
    constructor(){
        this.createdAt = new Date();
        this.updatedAt = new Date();    
    }
  protected touch(): void {
    this.updatedAt = new Date();
  }
  protected static validate(value: string,name: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${name} is required`);
  }
}



}