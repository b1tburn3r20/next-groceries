"use client"

import { useState, useEffect } from "react"
import { Plus, ShoppingCart, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { initializeApp } from "firebase/app"
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  DataSnapshot
} from "firebase/database"
const firebaseConfig = {
    databaseURL: process.env.NEXT_PUBLIC_DB_URL
  }
// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

interface Grocery {
  id: string
  name: string
}

export function GroceryManagerComponent() {
  const [groceries, setGroceries] = useState<Grocery[]>([])
  const [recentlyPurchased, setRecentlyPurchased] = useState<Grocery[]>([])
  const [newGrocery, setNewGrocery] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; grocery: Grocery | null }>({
    isOpen: false,
    grocery: null,
  })
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState("to-buy")

  useEffect(() => {
    const groceriesRef = ref(database, 'groceries')
    const purchasedRef = ref(database, 'purchased')

    const groceriesListener = onValue(groceriesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val()
      const groceryList: Grocery[] = data ? Object.entries(data).map(([id, name]) => ({ id, name: name as string })) : []
      setGroceries(groceryList)
    })

    const purchasedListener = onValue(purchasedRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val()
      const purchasedList: Grocery[] = data ? Object.entries(data).map(([id, name]) => ({ id, name: name as string })) : []
      setRecentlyPurchased(purchasedList.reverse()) // Reverse the order of purchased items
    })

    return () => {
      groceriesListener()
      purchasedListener()
    }
  }, [])

  const addGrocery = (e: React.FormEvent) => {
    e.preventDefault()
    if (newGrocery.trim()) {
      setIsAdding(true)
      const groceriesRef = ref(database, 'groceries')
      push(groceriesRef, newGrocery.trim())
        .then(() => {
          setNewGrocery("")
          setIsAdding(false)
          setActiveTab("to-buy") // Switch to "to-buy" tab after adding
        })
        .catch((error) => {
          console.error("Error adding grocery: ", error)
          setIsAdding(false)
        })
    }
  }

  const openConfirmDialog = (grocery: Grocery) => {
    setConfirmDialog({ isOpen: true, grocery })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, grocery: null })
  }

  const confirmPurchase = () => {
    if (confirmDialog.grocery) {
      const groceryRef = ref(database, `groceries/${confirmDialog.grocery.id}`)
      const purchasedRef = ref(database, 'purchased')
      
      remove(groceryRef)
        .then(() => push(purchasedRef, confirmDialog.grocery!.name))
        .then(() => closeConfirmDialog())
        .catch((error) => console.error("Error moving grocery to purchased: ", error))
    }
  }

  const removeFromRecentlyPurchased = (id: string) => {
    const purchasedRef = ref(database, `purchased/${id}`)
    remove(purchasedRef)
      .catch((error) => console.error("Error removing from recently purchased: ", error))
  }

  return (
    <div className="container mx-auto p-4 min-h-screen flex items-start justify-start">
      <Card className="w-full max-w-3xl bg-white/10 backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-white sm:text-3xl font-bold text-center">Groceries</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addGrocery} className="mb-6">
            <div className="flex gap-2 items-center">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={newGrocery}
                  onChange={(e) => setNewGrocery(e.target.value)}
                  placeholder="Add a new grocery item"
                  className="pr-10 text-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="sr-only">{isAdding ? "Adding..." : "Add item"}</span>
                </Button>
              </div>
            </div>
          </form>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="to-buy" className="flex items-center justify-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">To Buy</span>
                <span className="sm:hidden">Buy</span>
              </TabsTrigger>
              <TabsTrigger value="purchased" className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Purchased</span>
                <span className="sm:hidden">Bought</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="to-buy">
              <h3 className="text-lg font-semibold text-white mb-3">Items left to buy:</h3>
              <AnimatePresence>
                {groceries.map((grocery) => (
                  <motion.div
                    key={grocery.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className="flex items-center justify-between p-3 bg-white rounded-md cursor-pointer hover:bg-secondary/70 transition-colors mb-2"
                      onClick={() => openConfirmDialog(grocery)}
                    >
                      <span className="text-sm sm:text-base">{grocery.name}</span>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {groceries.length === 0 && (
                <p className="text-center text-white/70 text-sm sm:text-base">No items to buy. Add some groceries!</p>
              )}
            </TabsContent>
            <TabsContent value="purchased">
              <h3 className="text-lg font-semibold text-white mb-3">Recently purchased items:</h3>
              <AnimatePresence>
                {recentlyPurchased.map((grocery) => (
                  <motion.div
                    key={grocery.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between p-3 bg-white rounded-md mb-2">
                      <span className="text-sm sm:text-base">{grocery.name}</span>
                      <CheckCircle className="h-4 w-4 cursor-pointer" onClick={() => removeFromRecentlyPurchased(grocery.id)} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {recentlyPurchased.length === 0 && (
                <p className="text-center text-white/70 text-sm sm:text-base">No recently purchased items.</p>
              )}
            </TabsContent>
          </Tabs>

          <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Purchase</DialogTitle>
                <DialogDescription>
                  Are you sure you want to mark &quot;{confirmDialog.grocery?.name}&quot; as purchased?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:flex-row sm:justify-end gap-2">
                <Button variant="outline" onClick={closeConfirmDialog} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={confirmPurchase} className="w-full sm:w-auto">
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}