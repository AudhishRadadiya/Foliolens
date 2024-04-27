import React, { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; // needed for dayClick
import Container from "../components/Layout/Container";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ListCustomCalenderView from "../components/ListCustomCalenderView";
import CalanderProperties from "../components/CalanderProperties";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllTasksReminders } from "../Utility/ApiService";
import moment from "moment";

const Calender = () => {
  const allTasksReminders = useSelector(({ allTasksReminders }) => allTasksReminders);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isShowInfo, setIsShowInfo] = useState({});
  const [isActive, setIsActive] = useState(1);
  const [listView, setListView] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    fetchData();
    makeTodaybtnActive();
  }, []);

  const fetchData = () => {
    dispatch(fetchAllTasksReminders());
  };

  const groups = allTasksReminders.reduce((groups, data) => {
    const date = data.created_at.includes("T") ? data.created_at.split("T")[0] : data.created_at.split(" ")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(data);
    return groups;
  }, {});

  const groupArrays = Object.keys(groups).map((date, index) => {
    return {
      date,
      Task: groups[date].filter((item) => item.type === "Task"),
      Reminder: groups[date].filter((item) => item.type === "Reminder"),
      data: groups[date],
    };
  });

  const newEvent = [];
  groupArrays.map((data) => {
    newEvent.push(
      data.Task.length > 0 && { title: "Task", start: data.date, count: data.Task.length },
      data.Reminder.length > 0 && { title: "Reminder", start: data.date, count: data.Reminder.length }
    );
  });
  const filterByMonth = (month) => {
    setIsActive(month);

    let filteredTasks = [];
    if (month === 3) {
      filteredTasks = allTasksReminders.filter(
        (task) =>
          moment(task.next_occurance).format("MMMM YYYY") >= moment(new Date()).format("MMMM YYYY") ||
          moment(task.next_occurance).format("MMMM YYYY") <= moment(new Date().setMonth(month)).format("MMMM YYYY")
      );
      calendarRef.current.getApi().changeView("ListCustomCalenderView");
    } else {
      filteredTasks = allTasksReminders.filter(
        (task) =>
          moment(task.next_occurance).format("MMMM YYYY") >= moment(new Date()).format("MMMM YYYY") ||
          moment(task.next_occurance).format("MMMM YYYY") <= moment(new Date().setMonth(month)).format("MMMM YYYY")
      );
      calendarRef.current.getApi().changeView("ListCustomCalenderView");
    }
  };

  // const newEvent = allTasksReminders.map((item) => ({
  //   title: item.type,
  //   date: moment(item.created_at).format("YYYY-MM-DD"),
  // }));
  function makeTodaybtnActive() {
    var elems = document.querySelectorAll(".widget.hover");

    [].forEach.call(elems, function (el) {
      el.className = el.className.replace(/\bhover\b/, "");
    });
  }

  return (
    <Container title="Calendar" isBack={false}>
      <div className="customize-calender">
        <div className="tasks-reminder">
          <ul className="d-flex gap-3 pl-2">
            <li className="task">Tasks</li>
            <li className="reminders">Reminders</li>
          </ul>
        </div>

        <FullCalendar
          headerToolbar={{
            right: "prev,next,month1,months3,months12",
          }}
          customButtons={{
            month1: {
              text: (
                <p
                  style={{
                    color: isActive == 1 ? "#1646AA" : "#8C8C8C",
                    marginRight: "24px",
                    marginLeft: "24px",
                  }}
                >
                  Current Month
                </p>
              ),
              click: function () {
                filterByMonth(1);
              },
            },
            months3: {
              text: (
                <p
                  style={{
                    color: isActive == 3 ? "#1646AA" : "#8C8C8C",
                    marginRight: "24px",
                  }}
                >
                  Next 3 months
                </p>
              ),
              click: function () {
                setListView(true);
                filterByMonth(3);
              },
            },
            months12: {
              text: (
                <p
                  style={{
                    color: isActive === 12 ? "#1646AA" : "#8C8C8C",
                  }}
                >
                  Next 12 months
                </p>
              ),

              click: function () {
                setListView(true);
                filterByMonth(12);
              },
            },
          }}
          ref={calendarRef}
          plugins={[dayGridPlugin, ListCustomCalenderView, interactionPlugin]}
          events={newEvent?.filter((i) => i)}
          initialView="dayGridMonth"
          dayCellContent={(event) => {
            return (
              <CalanderProperties
                event={event}
                isShowInfo={isShowInfo[event.date.toISOString()]}
                onHide={() => setIsShowInfo({ [event.date.toISOString()]: false })}
              />
            );
          }}
          duration={{ months: isActive }}
          dateClick={(event) => {
            setIsShowInfo({ [event.date?.toISOString()]: !isShowInfo[event.date?.toISOString()] });
          }}
          eventClick={(event) => {
            setIsShowInfo({ [event.date?.toISOString()]: !isShowInfo[event.date?.toISOString()] });
          }}
          eventContent={(eventInfo) => (
            <>
              <div className={`dot ${eventInfo.event.title === "Reminder" ? "danger" : "success"}`} />
              <span>{eventInfo.event.extendedProps?.count}</span>
            </>
          )}
        />

        <div className="list-view-switch">
          <p>List view</p>
          <label className="theme-switch">
            <input
              type="checkbox"
              onChange={(e) => {
                setListView(!listView);
                if (e.target.checked) {
                  calendarRef.current.getApi().changeView("ListCustomCalenderView");
                } else {
                  calendarRef.current.getApi().changeView("dayGridMonth");
                }
              }}
              checked={listView}
            />
            <span className="theme-slider theme-round"></span>
          </label>
        </div>
        <div className="task-btn">
          <Button onClick={() => navigate("/AddTask")}>Add task</Button>
        </div>
      </div>
    </Container>
  );
};

export default Calender;
