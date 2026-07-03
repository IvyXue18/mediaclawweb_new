export function migrationPending(area: string): never {
  throw new Error(`Migration pending: ${area}`);
}

export function pendingJsonResponse(area: string, status = 501) {
  return Response.json(
    {
      code: -1,
      message: `Migration pending: ${area}`,
    },
    { status }
  );
}
