'use client'

import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'

export const AlertDialog = {
  Root: BaseAlertDialog.Root,
  Trigger: BaseAlertDialog.Trigger,
  Portal: BaseAlertDialog.Portal,
  Backdrop: BaseAlertDialog.Backdrop,
  Popup: BaseAlertDialog.Popup,
  Title: BaseAlertDialog.Title,
  Description: BaseAlertDialog.Description,
  Close: BaseAlertDialog.Close,
}

export type AlertDialogRootProps = React.ComponentProps<typeof BaseAlertDialog.Root>
