import { Link } from "umi";
import "../assets/global.less";
import "./index.less";

import { useEffect } from "react";
import { useModel } from "umi";
import Back from "@/components/Back";

export default function Layout(props: any) {
  return <div className="layout">{props.children}</div>;
}
