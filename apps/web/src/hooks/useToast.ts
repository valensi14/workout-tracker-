// apps/web/src/hooks/useToast.ts
export function useToast() {
  return {
    error: (msg: string) => {
      const el = document.createElement('div');
      el.textContent = msg;
      Object.assign(el.style, {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: '#FF3B30', color: '#fff', padding: '10px 20px',
        borderRadius: '8px', fontSize: '14px', zIndex: '9999',
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    },
  };
}
