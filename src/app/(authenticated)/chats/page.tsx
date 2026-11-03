'use client';

import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import MainChat from "./MainChat";

export default function ChatsPage() {
  return (
    <Provider store={store}>
      <MainChat />
    </Provider>
  );
}
