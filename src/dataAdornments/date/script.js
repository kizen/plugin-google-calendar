const toGoogleCalendarTimeRange = (
  input,
  isAllDay = false,
  durationInMinutes = 30
) => {
  const formatDateToGoogle = (dt) =>
    dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const formatDateOnly = (dt) =>
    dt.toISOString().slice(0, 10).replace(/-/g, "");

  if (typeof input === "string") {
    const startDate = new Date(input);

    if (isAllDay) {
      const endDate = new Date(startDate.getTime() + 86400000); // Add 24 hours
      return `${formatDateOnly(startDate)}/${formatDateOnly(endDate)}`;
    } else {
      const endDate = new Date(startDate.getTime() + durationInMinutes * 60000);
      return `${formatDateToGoogle(startDate)}/${formatDateToGoogle(endDate)}`;
    }
  }

  if (input && typeof input === "object" && typeof input.label === "string") {
    const [month, day, year] = input.label.split("/");
    const startDate = new Date(`${year}-${month}-${day}T00:00:00`);
    const endDate = new Date(startDate.getTime() + 86400000);
    return `${formatDateOnly(startDate)}/${formatDateOnly(endDate)}`;
  }

  throw new Error("Date Value invalid");
};

const buildEventName = (record, object, fieldId) => {
  const recordFields = Object.values(record.fields ?? {}) ?? [];
  const fieldName = recordFields.find(
    (field) => field.id === fieldId
  )?.display_name;

  let recordName = recordFields.find(
    (field) => field.name === "display_name"
  )?.value;

  if (!recordName && recordFields.length) {
    recordName = `${
      recordFields.find((field) => field.name === "first_name")?.value
    } ${recordFields.find((field) => field.name === "last_name")?.value}`;
  }

  if (!recordName && !fieldName && !object.object_name && !object.name) {
    return "";
  }

  if (record.activityId) {
    const recordNameResult = (recordName || record.display_name || "").replace(
      /[^a-zA-Z0-9 _-]/g,
      ""
    );
    console.log({ recordNameResult });
    return `${object.object_name || object.name}+Activity${
      recordNameResult ? "+-+" + recordNameResult : ""
    }`;
  }
  return `${object.object_name || object.name || ""}${
    recordName ? "+-+" + recordName : ""
  }${fieldName ? "+-+" + fieldName : ""}`;
};

const getAppBaseUrl = () => {
  if (this.applicationPath.includes("integration")) {
    return "https://v2.integration.kizen.dev";
  } else if (this.applicationPath.includes("staging")) {
    return "https://v2.staging.kizen.com";
  } else if (this.applicationPath.includes("go")) {
    return "https://go.kizen.com";
  }
  return "https://fmo.kizen.com";
};

const buildEventDetails = (record, object, activityId) => {
  this.preserve = true;
  console.log({ record, object, activityId });
  const baseUrl = getAppBaseUrl();
  console.log({ baseUrl });
  if (!object.id || !baseUrl) {
    return "";
  } else if (
    activityId &&
    object.id === this.currentBusiness.client_object.id &&
    record.id
  ) {
    return `View activity in Kizen: ${baseUrl}/client/${record.id}/details?view_scheduled_activity_id=${activityId}`;
  } else if (activityId && record.id) {
    return `View activity in Kizen: ${baseUrl}/custom-objects/${object.id}/${record.id}/details?view_scheduled_activity_id=${activityId}`;
  } else if (activityId) {
    return "";
  } else if (object.id === this.currentBusiness.client_object.id) {
    return `View record in Kizen: ${baseUrl}/client/${record.id}/details`;
  }
  return `View record in Kizen: ${baseUrl}/custom-objects/${object.id}/${record.id}/details`;
};

const getRecordUrl = (
  objectId = "",
  recordId = "",
  fieldNames = "",
  fieldIds = ""
) =>
  `/records/${objectId}/${recordId}?field_names=${fieldNames}&field_ids=${fieldIds}`;
const getObjectUrl = (objectId = "") => `/custom-objects/${objectId}`;
const getActivtyUrl = (activityId = "") => `/activities/${activityId}`;
const getActivityFieldUrl = (objectId = "", fieldId = "") =>
  `/activities/${objectId}/fields/${fieldId}`;

const getScheduledActivityUrl = (activityId) =>
  `/activities/scheduled-activity/${activityId}`;

let record;
let activity = { name: "" };
let object = this.args.objectId
  ? await this.get(getObjectUrl(this.args.objectId))
  : {};

if (this.args.activityId) {
  const scheduledActivity = await this.get(
    getScheduledActivityUrl(this.args.activityId)
  );
  if (scheduledActivity) {
    activity = (await this.get(
      getActivtyUrl(scheduledActivity.activity_object.id)
    )) ?? { name: "" };
    object = {
      ...object,
      object_name: activity?.name || "",
    };
  }

  switch (this.args.fieldId) {
    case "due_datetime":
      record = {
        id: this.args.entityId,
        display_name: "Due Date",
      };
      break;
    case "due_datetime_my_time":
      record = { id: this.args.entityId, display_name: "Due Date" };
      break;
    case "original_due_datetime":
      record = { id: this.args.entityId, display_name: "Original Due Date" };
      break;
    default:
      const fetchedRecord =
        this.args.objectId && this.args.entityId
          ? (await this.get(
              getRecordUrl(
                this.args.objectId,
                this.args.entityId,
                "name",
                this.args.fieldId
              )
            )) ?? {}
          : {};
      record = fetchedRecord;
      break;
  }
  record = { ...record, activityId: this.args.activityId };
} else {
  record =
    (await this.get(
      getRecordUrl(
        this.args.objectId,
        this.args.entityId,
        "name",
        this.args.fieldId
      )
    )) ?? {};
}

const isAllDayEvent = this.args.fieldType === "date";
const dateRange = toGoogleCalendarTimeRange(this.args.value, isAllDayEvent);
console.log({ dateRange });
const eventName = buildEventName(record, object, this.args.fieldId);
console.log({ eventName });
const eventDetails = buildEventDetails(record, object, this.args.activityId);
console.log({ eventDetails });

this.openWindow(
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventName}&details=${eventDetails}&dates=${dateRange}&ctz=${this.currentBusiness.timezone.name}`
);
