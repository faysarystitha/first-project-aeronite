import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Username must be a string.' })
  @IsNotEmpty({ message: 'Username cannot be empty.' })
  @Matches(/^\S*$/, { message: 'Username cannot contain space.' })
  username: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password cannot be empty.' })
  @MinLength(8, { message: 'Password must consist of at least 8 characters.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must consist of uppercase letter, lowercase letter, and number.',
  })
  password: string;

  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name: string;

  @IsString({ message: 'Email must be a string.' })
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  email: string;
}
