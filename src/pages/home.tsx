import { PocketKnife } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { tools } from '@/lib/tools'

export function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <PocketKnife className="h-14 w-14 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Swiss Developers Knife
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground italic">
          a weird tool by a weird guy for weird people
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.id} to={tool.path} className="text-left">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tool.icon className="h-5 w-5 text-primary" />
                  {tool.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {tool.description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
