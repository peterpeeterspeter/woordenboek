import { NextResponse } from 'next/server';
import { getWordList, LETTERS } from '../../../../lib/dictionary';

export async function GET(request, { params }) {
  const l = params.letter?.toLowerCase();
  if (!l || !LETTERS.includes(l)) {
    return NextResponse.json([], { status: 404 });
  }
  const words = getWordList(l);
  return NextResponse.json(words, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
