'use client'

import { Menu as BaseMenu } from '@base-ui/react/menu'

export const Menu = {
  Root: BaseMenu.Root,
  Trigger: BaseMenu.Trigger,
  Portal: BaseMenu.Portal,
  Positioner: BaseMenu.Positioner,
  Popup: BaseMenu.Popup,
  Arrow: BaseMenu.Arrow,
  Item: BaseMenu.Item,
  LinkItem: BaseMenu.LinkItem,
  Separator: BaseMenu.Separator,
  Group: BaseMenu.Group,
  GroupLabel: BaseMenu.GroupLabel,
  CheckboxItem: BaseMenu.CheckboxItem,
  CheckboxItemIndicator: BaseMenu.CheckboxItemIndicator,
  RadioGroup: BaseMenu.RadioGroup,
  RadioItem: BaseMenu.RadioItem,
  RadioItemIndicator: BaseMenu.RadioItemIndicator,
  SubmenuRoot: BaseMenu.SubmenuRoot,
  SubmenuTrigger: BaseMenu.SubmenuTrigger,
}

export type MenuRootProps = React.ComponentProps<typeof BaseMenu.Root>
