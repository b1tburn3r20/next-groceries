import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, remove } from "firebase/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, CheckCircle, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const appSettings = {
  databaseURL: process.env.NEXT_PUBLIC_DB_URL,
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const groceriesInDB = ref(database, "groceries");
const purchasedInDB = ref(database, "purchased");

const GroceryManagerComponent = () => {
  const [groceries, setGroceries] = useState([]);
  const [recentlyPurchased, setRecentlyPurchased] = useState([]);
  const [newGrocery, setNewGrocery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("to-buy");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    grocery: null,
  });

  useEffect(() => {
    const unsubscribeGroceries = onValue(groceriesInDB, (snapshot) => {
      if (snapshot.exists()) {
        const groceriesArray = Object.entries(snapshot.val()).reverse();
        setGroceries(groceriesArray);
      } else {
        setGroceries([]);
      }
    });

    const unsubscribePurchased = onValue(purchasedInDB, (snapshot) => {
      if (snapshot.exists()) {
        const purchasedArray = Object.entries(snapshot.val()).reverse();
        setRecentlyPurchased(purchasedArray);
      } else {
        setRecentlyPurchased([]);
      }
    });

    return () => {
      unsubscribeGroceries();
      unsubscribePurchased();
    };
  }, []);

  const addGrocery = (e) => {
    e.preventDefault();
    const inputValue = newGrocery.trim();
    if (inputValue !== "") {
      setIsAdding(true);
      push(groceriesInDB, inputValue)
        .then(() => {
          console.log(`${inputValue} successfully pushed to db`);
          setNewGrocery("");
          setIsAdding(false);
          setActiveTab("to-buy");
        })
        .catch((error) => {
          console.error("Error adding grocery: ", error);
          setIsAdding(false);
        });
    } else {
      console.log("user must input text to submit the form");
    }
  };

  const openConfirmDialog = (grocery) => {
    setConfirmDialog({ isOpen: true, grocery });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, grocery: null });
  };

  const confirmPurchase = () => {
    if (confirmDialog.grocery) {
      const [id, name] = confirmDialog.grocery;
      const groceryRef = ref(database, `groceries/${id}`);
      remove(groceryRef)
        .then(() => push(purchasedInDB, name))
        .then(() => closeConfirmDialog())
        .catch((error) =>
          console.error("Error moving grocery to purchased: ", error)
        );
    }
  };

  const removeFromRecentlyPurchased = (id) => {
    const purchasedRef = ref(database, `purchased/${id}`);
    remove(purchasedRef).catch((error) =>
      console.error("Error removing from recently purchased: ", error)
    );
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 min-h-screen flex items-start justify-center">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl text-white font-bold text-center">
            Groceries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addGrocery} className="mb-4 sm:mb-6">
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                value={newGrocery}
                onChange={(e) => setNewGrocery(e.target.value)}
                placeholder="Add item"
                className="flex-grow text-white text-sm sm:text-base"
              />
              <Button
                type="submit"
                disabled={isAdding}
                size="sm"
                className="px-2 sm:px-3"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isAdding ? "Adding..." : "Add item"}
                </span>
              </Button>
            </div>
          </form>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="to-buy"
                className="flex items-center justify-center text-xs sm:text-sm"
              >
                <ShoppingCart className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span>To Buy</span>
              </TabsTrigger>
              <TabsTrigger
                value="purchased"
                className="flex items-center justify-center text-xs sm:text-sm"
              >
                <CheckCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span>Purchased</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="to-buy">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                Items to buy:
              </h3>
              <AnimatePresence>
                {groceries.length > 0 ? (
                  groceries.map(([id, name]) => (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-md cursor-pointer hover:bg-secondary/70 transition-colors mb-2"
                        onClick={() => openConfirmDialog([id, name])}
                      >
                        <span className="text-xs sm:text-sm">{name}</span>
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-white/70 text-xs sm:text-sm">
                    No items to buy. Add some groceries!
                  </p>
                )}
              </AnimatePresence>
            </TabsContent>
            <TabsContent value="purchased">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                Recently purchased items:
              </h3>
              <AnimatePresence>
                {recentlyPurchased.length > 0 ? (
                  recentlyPurchased.map(([id, name]) => (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-md mb-2">
                        <span className="text-xs sm:text-sm">{name}</span>
                        <CheckCircle
                          className="h-3 w-3 sm:h-4 sm:w-4 cursor-pointer"
                          onClick={() => removeFromRecentlyPurchased(id)}
                        />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-white/70 text-xs sm:text-sm">
                    No recently purchased items.
                  </p>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>

          <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
            <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Confirm Purchase
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Are you sure you want to mark "{confirmDialog.grocery?.[1]}"
                  as purchased?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeConfirmDialog}
                  className="w-full sm:w-auto text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPurchase}
                  className="w-full sm:w-auto text-sm"
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroceryManagerComponent;
