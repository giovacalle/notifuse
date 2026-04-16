import { Button, Dropdown } from 'antd'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { useTheme } from '../../contexts/ThemeContext'

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useLingui()

  const currentIcon = resolvedTheme === 'dark'
    ? <Moon size={14} />
    : <Sun size={14} />

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectedKeys: [theme],
        items: [
          { key: 'light', icon: <Sun size={14} />, label: t`Light`, onClick: () => setTheme('light') },
          { key: 'system', icon: <Monitor size={14} />, label: t`Device`, onClick: () => setTheme('system') },
          { key: 'dark', icon: <Moon size={14} />, label: t`Dark`, onClick: () => setTheme('dark') },
        ],
      }}
      placement="bottomRight"
    >
      <Button color="default" variant="filled" icon={currentIcon} />
    </Dropdown>
  )
}
