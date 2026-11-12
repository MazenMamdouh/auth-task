import { PASSWORD_RULES } from '@/lib/validation';

/** Each rule ticks green as it is met, so the user never has to guess what is missing. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600' : 'text-slate-500'}`} data-met={ok}>
            <span aria-hidden className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${ok ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              {ok ? '✓' : '•'}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
