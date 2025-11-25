
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

async function getExpiringMedications() {
  const today = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(today.getDate() + 60);

  return await prisma.medication.findMany({
    where: {
      expirationDate: {
        lte: sixtyDaysFromNow,
        gte: today,
      },
    },
    orderBy: {
      expirationDate: 'asc',
    },
  });
}

export async function ExpiringMedications() {
  const medications = await getExpiringMedications();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Médicaments Expirant Bientôt</CardTitle>
      </CardHeader>
      <CardContent>
        {medications.map((medication) => {
          const expirationLabel = medication.expirationDate
            ? new Date(medication.expirationDate).toLocaleDateString()
            : 'N/A';

          return (
            <div key={medication.id} className="flex justify-between">
              <span>{medication.name}</span>
              <span className="text-orange-500">
                Expire le {expirationLabel}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
