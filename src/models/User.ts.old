import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document{
    username: string;
    passwordHash: string;
    comparePassword(password: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema({
    username: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: true}
});

userSchema.methods.comparePassword = function(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;