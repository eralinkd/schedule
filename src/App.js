import React, { useEffect, useState } from "react";

import Cell from "./Components/Cell";
import { initialScheduleData } from "./config";
import styles from "./App.module.css";

const daysOfWeek = ["mo", "tu", "we", "th", "fr", "sa", "su"];
const hoursInDay = 24;
function App() {
  const [scheduleData, setScheduleData] = useState(initialScheduleData);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [savedSchedule, setSavedSchedule] = useState(initialScheduleData);

  useEffect(() => {
    const savedSchedule = localStorage.getItem('scheduleData');
    if (savedSchedule) {
      const parsedSchedule = JSON.parse(savedSchedule);
      setScheduleData(parsedSchedule);
      setSavedSchedule(parsedSchedule);
    }
  }, []);

  useEffect(() => {
    setIsSaveDisabled(
      JSON.stringify(scheduleData) === JSON.stringify(savedSchedule)
    );
  }, [scheduleData, savedSchedule]);

  const toggleCell = (day, hour, addOnly = false) => {
    setScheduleData((prevSchedule) => {
      const updatedDay = [...prevSchedule[day]];
      const currentMinute = hour * 60;
      const endMinute = currentMinute + 59;

      const isSelected = updatedDay.some(
        (interval) => currentMinute >= interval.bt && endMinute <= interval.et
      );

      if (isSelected && !addOnly) {
        const newDay = updatedDay
          .map((interval) => {
            if (currentMinute > interval.et || endMinute < interval.bt) {
              return interval;
            }
            const newIntervals = [];
            if (interval.bt < currentMinute) {
              newIntervals.push({ bt: interval.bt, et: currentMinute - 1 });
            }
            if (interval.et > endMinute) {
              newIntervals.push({ bt: endMinute + 1, et: interval.et });
            }
            return newIntervals;
          })
          .flat();
        return { ...prevSchedule, [day]: newDay };
      } else if (!isSelected) {
        updatedDay.push({ bt: currentMinute, et: endMinute });
        updatedDay.sort((a, b) => a.bt - b.bt);

        const selectedMinutes = updatedDay.reduce(
          (total, interval) => total + (interval.et - interval.bt + 1),
          0
        );

        if (selectedMinutes === hoursInDay * 60) {
          return { ...prevSchedule, [day]: [{ bt: 0, et: 1439 }] };
        } else {
          return { ...prevSchedule, [day]: updatedDay };
        }
      }
      return prevSchedule;
    });
  };

  const handleMouseDown = (day, hour, event) => {
    setIsDragging(true);
    setDragStart({ day, hour });
    setStartCoords({ x: event.clientX, y: event.clientY });
    toggleCell(day, hour);
  };

  const handleMouseMove = (event) => {
    if (!isDragging || !dragStart) return;

    const { clientX, clientY } = event;
    const dx = Math.abs(clientX - startCoords.x);
    const dy = Math.abs(clientY - startCoords.y);

    if (dx > 10 || dy > 10) {
      const element = document.elementFromPoint(clientX, clientY);
      if (
        element &&
        element.dataset &&
        element.dataset.day &&
        element.dataset.hour
      ) {
        const day = element.dataset.day;
        const hour = parseInt(element.dataset.hour, 10);
        toggleCell(day, hour, true);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setStartCoords({ x: 0, y: 0 });
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    // eslint-disable-next-line
  }, [isDragging]);

  const toggleAllDay = (day) => {
    setScheduleData((prev) => {
      const isSelected = prev[day].some(
        (interval) => interval.bt === 0 && interval.et === 1439
      );
      return { ...prev, [day]: isSelected ? [] : [{ bt: 0, et: 1439 }] };
    });
  };

  const clearSchedule = () => {
    setScheduleData(
      daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
    );
  };

  const saveChanges = () => {
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
    setSavedSchedule(scheduleData);
    console.log("Saved Schedule:", JSON.stringify(scheduleData));
  };

  const checkCellSelected = (day, hour) => {
    return scheduleData[day].some(
      (interval) => hour * 60 >= interval.bt && hour * 60 <= interval.et
    );
  };

  const checkAllDaySelected = (day) => {
    const intervals = scheduleData[day];
    if (intervals.length === 0) return false;
    const selectedMinutes = intervals.reduce(
      (total, interval) => total + (interval.et - interval.bt + 1),
      0
    );
    return selectedMinutes === hoursInDay * 60;
  };

  const hoursLabels = () => {
    return Array.from({ length: hoursInDay / 3 }, (_, index) => {
      const hour = index * 3;
      const formattedHour = hour.toString().padStart(2, "0");
      return (
        <div key={index} className={styles.hourLabel}>
          {formattedHour}:00
        </div>
      );
    });
  };

  const renderSchedule = () => (
    <>
      <div className={styles.hoursRow}>
        <div className={styles.hourLabel}></div>
        <div className={styles.hourLabel}>ALL DAY</div>
        {hoursLabels()}
      </div>
      {daysOfWeek.map((day) => (
        <div key={day} className={styles.dayRow}>
          <Cell text={day.toUpperCase()} big={true} isDayCell={true} isSelected={checkAllDaySelected(day)}/>
          <Cell
            toggleAllDay={() => toggleAllDay(day)}
            isSelected={checkAllDaySelected(day)}
            big={true}
            isAllDaycell={true}
          />
          {Array.from({ length: hoursInDay }).map((_, hour) => (
            <Cell
              key={hour}
              day={day}
              hour={hour}
              isSelected={checkCellSelected(day, hour)}
              onMouseDown={(e) => handleMouseDown(day, hour, e)}
              data-day={day}
              data-hour={hour}
            />
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className={styles.scheduleContainer}>
      <h1>SET SCHEDULE</h1>
      {renderSchedule()}
      <div className={styles.controls}>
        <button onClick={clearSchedule}>Clear</button>
        <button onClick={saveChanges} disabled={isSaveDisabled}>Save Changes</button>
      </div>
    </div>
  );
}

export default App;
