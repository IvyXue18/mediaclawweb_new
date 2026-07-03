import {
  findPartnerSupplierByUserId,
  getPartnerCredentials,
  isSupplierCurrentlyActive,
} from '@/shared/models/partner';
import { getSignUser } from '@/shared/models/user';

export async function GET(req: Request) {
  const user = await getSignUser();
  if (!user) {
    return Response.json({ ok: false, message: 'no auth' }, { status: 401 });
  }

  const supplier = await findPartnerSupplierByUserId(user.id);
  if (!supplier || !isSupplierCurrentlyActive(supplier)) {
    return Response.json(
      { ok: false, message: 'partner access denied' },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'all';
  const credentials = await getPartnerCredentials({
    partnerId: supplier.partnerId,
    status,
    limit: 10000,
  });

  const rows = [
    [
      'code',
      'status',
      'activationStatus',
      'planCode',
      'partnerId',
      'variantId',
      'sourceOrderNo',
      'assignmentNote',
      'activatedAt',
      'expiresAt',
      'createdAt',
    ],
    ...credentials.map((item: any) => [
      item.code,
      item.status,
      item.activationStatus,
      item.planCode,
      item.partnerId || '',
      item.variantId || 'official',
      item.sourceOrderNo,
      item.assignmentNote || '',
      item.activatedAt || '',
      item.expiresAt || '',
      item.createdAt,
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="mediaclaw-${supplier.partnerId}-credentials.csv"`,
    },
  });
}

function escapeCsv(value: unknown) {
  const text =
    value instanceof Date
      ? value.toISOString()
      : String(value === null || value === undefined ? '' : value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
