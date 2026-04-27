import './globals.css'
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'uTube',
  description: 'None of your business',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0, backgroundColor:"#121212",fontFamily: "Arial, sans-serif"}}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}