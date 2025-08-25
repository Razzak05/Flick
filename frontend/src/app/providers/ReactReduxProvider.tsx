"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../redux/store";
import { Loader2 } from "lucide-react";

export default function ReactReduxProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="max-w-7xl mx-auto flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-[#2834e0]" />
          </div>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
