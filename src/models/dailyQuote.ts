import quotes from '../../json/frases-personagens.json';

export interface WorkoutQuote {
    id: number;
    game: string;
    character: string;
    quote: string;
}

function hashString(value: string): number{
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function getDailyQuote(): WorkoutQuote{
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const index = hashString(dateKey) % quotes.length;
    return quotes[index];
}
