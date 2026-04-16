import { ConfigProvider, App as AntApp, ThemeConfig, theme as antTheme } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { I18nProvider } from '@lingui/react'
import { router } from './router'
import { AuthProvider } from './contexts/AuthContext'
import { LocaleProvider, useLocale, i18n } from './contexts/LocaleContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { initializeAnalytics } from './utils/analytics-config'
import enUS from 'antd/locale/en_US'
import frFR from 'antd/locale/fr_FR'
import esES from 'antd/locale/es_ES'
import deDE from 'antd/locale/de_DE'
import caES from 'antd/locale/ca_ES'
import type { Locale as AntdLocale } from 'antd/es/locale'
import type { Locale } from './i18n'

const antdLocales: Record<Locale, AntdLocale> = {
  en: enUS,
  fr: frFR,
  es: esES,
  de: deDE,
  ca: caES,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

// Ant Design requires hex values for its color derivation engine (hover/active/derived states).
// CSS variables (var()) break Ant Design's internal color processing — use hex here.
// For Tailwind classes and inline styles, use CSS variables from index.css instead.
// Hex values here MUST match the CSS variables in index.css to stay in sync.
function useAppTheme(): ThemeConfig {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return {
    algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#7763F1',
      colorLink: '#7763F1',
      colorPrimaryBg: isDark ? '#1e1a2e' : undefined,             // --primary-bg
      colorPrimaryBgHover: isDark ? '#1e1a2e' : undefined,
      colorPrimaryBorder: isDark ? '#5a4fa0' : undefined,          // --primary-border
      colorPrimaryBorderHover: isDark ? '#7763F1' : undefined,     // --primary
      colorBgLayout: isDark ? '#141414' : '#F9F9F9',               // --background
      colorBgContainer: isDark ? '#1f1f1f' : '#F9F9F9',            // --surface / --background
      colorBgElevated: isDark ? '#1f1f1f' : '#F9F9F9',             // --surface
      colorBorder: isDark ? '#1a1a1a' : '#f0f0f0',                 // --border-base
      colorBorderSecondary: isDark ? '#1a1a1a' : '#e5e5e5',        // --border-base
      colorText: isDark ? '#e5e5e5' : undefined,                   // --foreground
      colorTextSecondary: isDark ? '#a3a3a3' : undefined,           // --muted-foreground
      colorPrimaryText: isDark ? '#9b8ff5' : undefined,             // --primary-text
      colorPrimaryTextHover: isDark ? '#b3a9f8' : undefined,        // --primary-light
      colorPrimaryTextActive: isDark ? '#7763F1' : undefined,       // --primary
      colorTextBase: isDark ? '#e5e5e5' : undefined,                // --foreground
      colorTextQuaternary: isDark ? '#525252' : undefined,
      colorFillSecondary: isDark ? '#262626' : undefined,           // --surface-secondary
      colorFillTertiary: isDark ? '#1f1f1f' : undefined,            // --surface
    },
    components: {
      Layout: {
        bodyBg: isDark ? '#141414' : '#F9F9F9',
        lightSiderBg: isDark ? '#141414' : '#F9F9F9',
        siderBg: isDark ? '#141414' : '#F9F9F9',
      },
      Card: {
        headerFontSize: 16,
        borderRadius: 4,
        borderRadiusLG: 4,
        borderRadiusSM: 4,
        borderRadiusXS: 4,
        colorBorderSecondary: isDark ? '#1a1a1a' : '#e5e5e5',
        colorBgContainer: isDark ? '#1f1f1f' : '#F9F9F9',
      },
      Table: {
        headerBg: 'transparent',
        fontSize: 12,
        colorTextHeading: isDark ? '#a3a3a3' : 'rgb(51 65 85)',
        colorBgContainer: 'transparent',
        rowHoverBg: 'transparent',
        ...(isDark ? {
          borderColor: '#1a1a1a',
          colorSplit: '#1a1a1a',
          headerColor: '#a3a3a3',
          colorText: '#d4d4d4',
          headerSplitColor: '#1a1a1a',
        } : {}),
      },
      Drawer: {
        colorBgElevated: isDark ? '#1f1f1f' : '#F9F9F9',
      },
      Modal: {
        colorBgElevated: isDark ? '#1f1f1f' : '#F9F9F9',
      },
      Tabs: isDark ? {
        itemColor: '#b3b3b3',
        itemActiveColor: '#ffffff',
        itemHoverColor: '#e5e5e5',
        inkBarColor: '#7763F1',
        cardBg: '#1f1f1f',
      } : {},
      Descriptions: isDark ? {
        colorSplit: '#1a1a1a',
        colorBgContainer: '#1f1f1f',
      } : {},
      Timeline: {
        dotBg: isDark ? '#141414' : '#F9F9F9',
      },
      Menu: {
        itemBg: 'transparent',
        subMenuItemBg: 'transparent',
        ...(isDark ? {
          itemSelectedBg: '#7763F1',
          itemSelectedColor: '#ffffff',
          itemColor: '#b3b3b3',
          itemHoverColor: '#e5e5e5',
          itemHoverBg: '#1f1f1f',
        } : {}),
      },
      Input: {
        colorBgContainer: isDark ? '#262626' : undefined,
      },
      Select: {
        colorBgContainer: isDark ? '#262626' : undefined,
      },
      Tag: isDark ? {
        defaultBg: '#262626',
        defaultColor: '#d4d4d4',
        colorBorder: '#2a2a2a',
      } : {},
      Segmented: isDark ? {
        itemColor: '#b3b3b3',
        itemSelectedColor: '#ffffff',
        itemSelectedBg: '#7763F1',
        trackBg: '#262626',
        itemHoverBg: '#1f1f1f',
        itemHoverColor: '#e5e5e5',
      } : {},
      Badge: isDark ? {
        colorBgContainer: '#262626',
      } : {},
      Alert: isDark ? {
        colorInfoBg: '#111a2c',
        colorInfoBorder: '#153450',
        colorSuccessBg: '#162312',
        colorSuccessBorder: '#274916',
        colorWarningBg: '#2b2111',
        colorWarningBorder: '#594214',
        colorErrorBg: '#2c1519',
        colorErrorBorder: '#58181c',
      } : {},
      Tooltip: isDark ? {
        colorBgSpotlight: '#262626',
        colorTextLightSolid: '#e5e5e5',
      } : {},
      Popover: isDark ? {
        colorBgElevated: '#1f1f1f',
      } : {},
      Dropdown: isDark ? {
        colorBgElevated: '#1f1f1f',
        controlItemBgHover: '#262626',
      } : {},
      Switch: isDark ? {
        colorPrimary: '#7763F1',
        colorPrimaryHover: '#9b8ff5',
      } : {},
      Button: isDark ? {
        defaultBg: '#262626',
        defaultBorderColor: '#2a2a2a',
        defaultColor: '#d4d4d4',
        defaultGhostColor: '#ffffff',
        defaultGhostBorderColor: '#7763F1',
      } : {},
      Empty: isDark ? {
        colorTextDescription: '#737373',
      } : {},
      Spin: isDark ? {
        colorPrimary: '#7763F1',
      } : {},
      Pagination: isDark ? {
        itemBg: 'transparent',
        itemActiveBg: '#7763F1',
        colorText: '#b3b3b3',
      } : {},
      Form: isDark ? {
        labelColor: '#d4d4d4',
      } : {},
      Divider: isDark ? {
        colorSplit: '#1a1a1a',
      } : {},
      Steps: isDark ? {
        colorTextDescription: '#737373',
      } : {},
      Radio: isDark ? {
        buttonBg: '#262626',
        buttonCheckedBg: '#7763F1',
        buttonColor: '#d4d4d4',
        buttonSolidCheckedColor: '#ffffff',
      } : {},
    }
  }
}

// Initialize analytics service
initializeAnalytics()

// Inner component that uses LocaleContext + ThemeContext
function AppContent() {
  const { locale } = useLocale()
  const themeConfig = useAppTheme()

  return (
    // key={locale} forces I18nProvider and all children to remount when locale changes,
    // ensuring all components re-render with the new translations
    <I18nProvider i18n={i18n} key={locale}>
      <ConfigProvider theme={themeConfig} locale={antdLocales[locale]}>
        <AntApp>
          <RouterProvider router={router} />
        </AntApp>
      </ConfigProvider>
    </I18nProvider>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <LocaleProvider>
            <AppContent />
          </LocaleProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
