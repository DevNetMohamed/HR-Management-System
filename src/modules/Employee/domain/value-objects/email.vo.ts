export class Email{
    private constructor(public readonly value: string) {}

    static create(row: string): Email {
        const value = row.trim().toLowerCase();
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            throw new Error('Invalid email');

        return new Email(value);
    }
}