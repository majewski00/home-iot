import { Router } from "express";
import dataRoute from "./data";

export default (router: Router) => {
  dataRoute(router);
};
