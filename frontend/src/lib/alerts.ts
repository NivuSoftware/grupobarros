import Swal, { type SweetAlertIcon } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const commonClasses = {
  popup: "gb-swal-popup",
  title: "gb-swal-title",
  htmlContainer: "gb-swal-text",
  confirmButton: "gb-swal-confirm",
  cancelButton: "gb-swal-cancel",
  actions: "gb-swal-actions",
};

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: commonClasses,
  color: "#111111",
  background: "#ffffff",
});

export function getErrorMessage(error: unknown, fallback = "Ocurrió un error") {
  return error instanceof Error ? error.message : fallback;
}

export function notify(title: string, icon: SweetAlertIcon = "success", text?: string) {
  return toast.fire({
    icon,
    title,
    text,
  });
}

export function notifySuccess(title: string, text?: string) {
  return notify(title, "success", text);
}

export function notifyError(title: string, text?: string) {
  return notify(title, "error", text);
}

export async function confirmAction({
  title,
  text,
  confirmButtonText = "Aceptar",
  cancelButtonText = "Cancelar",
  icon = "warning",
}: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: SweetAlertIcon;
}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    customClass: commonClasses,
    buttonsStyling: false,
    color: "#111111",
    background: "#ffffff",
  });

  return result.isConfirmed;
}
