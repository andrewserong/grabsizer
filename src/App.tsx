import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { SunMoon } from "lucide-react"
import { Cog } from "lucide-react"
import { useTheme } from "./components/theme-provider"

export function App() {
  const { theme, setTheme } = useTheme()
  console.log("Current theme:", theme)
  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background">
        <div className="m-auto flex max-w-3xl items-center justify-between p-2">
          <span className="text-sm leading-none">Grabsizer</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <SunMoon />
            </Button>
            <Dialog>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <Cog />
                  </Button>
                }
              ></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grabsizer settings</DialogTitle>
                  <DialogDescription>
                    Adjust settings for resizing your images.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <main className="w-full p-8">
        <div className="flex min-h-svh justify-center p-6">
          <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
            <div className="w-[500px]">
              <Dropzone>
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>
            </div>
            <div>
              <h1 className="font-medium">Project ready!</h1>
              <p>You may now add components and start building.</p>
              <p>We&apos;ve already added the button component for you.</p>
              <Button className="mt-2">Button</Button>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              (Press <kbd>d</kbd> to toggle dark mode)
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default App
