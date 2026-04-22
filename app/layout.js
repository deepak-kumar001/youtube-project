import './globals.css'

export const metadata = {
  title: 'uTube',
  description: 'None of your business',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0, backgroundColor:"#121212",fontFamily: "Arial, sans-serif"}}>{children}</body>
    </html>
  )
}