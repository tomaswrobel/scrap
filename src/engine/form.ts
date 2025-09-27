export const target = new EventTarget();

export function submit(id: string) {
    const input = document.getElementById(id) as HTMLInputElement;
    target.dispatchEvent(new CustomEvent(id, {detail: input.value}));
}