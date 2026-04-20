'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'

export const Dialog = {
  Root: BaseDialog.Root,
  Trigger: BaseDialog.Trigger,
  Portal: BaseDialog.Portal,
  Backdrop: BaseDialog.Backdrop,
  Popup: BaseDialog.Popup,
  Title: BaseDialog.Title,
  Description: BaseDialog.Description,
  Close: BaseDialog.Close,
}

export type DialogRootProps = React.ComponentProps<typeof BaseDialog.Root>
