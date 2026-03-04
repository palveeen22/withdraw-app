import { z } from 'zod';

export const withdrawSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => {
      const n = parseFloat(v);
      return !isNaN(n) && n > 0;
    }, 'Amount must be greater than 0'),
  destination: z
    .string()
    .min(1, 'Destination address is required')
    .min(10, 'Please enter a valid destination address'),
  confirm: z.boolean().refine((v) => v === true, {
    message: 'You must confirm the withdrawal',
  }),
});

export type WithdrawFormValues = z.infer<typeof withdrawSchema>;
