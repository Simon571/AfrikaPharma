
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';

async function getRecentSales() {
  return await prisma.sale.findMany({
    take: 5,
    orderBy: {
      date: 'desc',
    },
    include: {
      client: true,
      seller: true,
      items: {
        include: {
          medication: true,
        },
      },
    },
  });
}

export async function RecentSales() {
  const sales = await getRecentSales();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventes Récentes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        {sales.map((sale) => (
          <div key={sale.id} className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex">
              <AvatarFallback>{sale.client.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">{sale.client.name}</p>
              <p className="text-sm text-muted-foreground">Vendu par {sale.seller.username}</p>
              <div className="text-sm text-muted-foreground">
                {sale.items.map((item) => (
                  <span key={item.id} className="mr-2">
                    {item.medication.name} (x{item.quantity})
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-auto font-medium">+{formatCurrency(sale.totalAmount)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
