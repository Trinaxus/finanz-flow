import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const { updateDate, ...transactionData } = req.body;

      // Alle zukünftigen Transaktionen der Serie aktualisieren
      const updatedTransactions = await prisma.transaction.updateMany({
        where: {
          recurringId: String(id),
          date: {
            gte: updateDate
          }
        },
        data: {
          amount: transactionData.amount,
          description: transactionData.description,
          category: transactionData.category,
          type: transactionData.type,
          // Datum und recurringId bleiben unverändert
        }
      });

      res.json(updatedTransactions);
    } catch (error) {
      console.error('Error updating recurring transactions:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren der wiederkehrenden Zahlungen' });
    }
  } else {
    res.status(405).json({ error: 'Methode nicht erlaubt' });
  }
} 