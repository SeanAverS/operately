import React from "react";

import { RelativeTime, RelativeDay } from "./RelativeTime";
import ShortDate from "./ShortDate";
import ShortDateWithTime from "./ShortDateWithTime";
import * as Time from "@/utils/time";
import { useTranslation } from "react-i18next";

type Format =
  | "relative-day"
  | "relative"
  | "short-date"
  | "short-date-with-time"
  | "time-only"
  | "short-date-with-weekday-relative"
  | "long-date";

interface FormattedTimeProps {
  time: string | Date;
  format: Format;
}

export default function FormattedTime(props: FormattedTimeProps): JSX.Element {
  const parsedTime = Time.parse(props.time);

  if (!parsedTime) {
    return <>Invalid date</>;
  }

  switch (props.format) {
    case "relative-day":
      return <RelativeDay time={parsedTime} />;
    case "relative":
      return <RelativeTime time={parsedTime} />;
    case "short-date":
      return <ShortDate time={parsedTime} />;
    case "short-date-with-time":
      return <ShortDateWithTime time={parsedTime} />;
    case "time-only":
      return (
        <>
          {parsedTime
            .toLocaleTimeString("en-US", { timeStyle: "short", hour12: true })
            .replace(" AM", "am")
            .replace(" PM", "pm")}
        </>
      );
    case "short-date-with-weekday-relative":
      return <ShortDate time={parsedTime} weekday />;
    case "long-date":
      return <LongDate time={parsedTime} />;
    default:
      throw "Unknown format " + props.format;
  }
}

function LongDate({ time }: { time: Date }): JSX.Element {
  const { t } = useTranslation();

  let options = {
    val: time,
    formatParams: {
      val: {
        day: "numeric",
        month: "long",
        year: Time.isCurrentYear(time) ? undefined : "numeric",
      },
    },
  };

  let day = time.getDate();

  let suffix = "";
  if (day === 1) {
    suffix = "st";
  } else if (day === 2) {
    suffix = "nd";
  } else if (day === 3) {
    suffix = "rd";
  } else {
    suffix = "th";
  }

  return (
    <>
      {t("intlDateTime", options)}
      {suffix}
    </>
  );
}
