import dayjs from "https://cdn.skypack.dev/dayjs@1.10.6?dts";

const token = Deno.env.get("ASANA_TOKEN");
const projectId = Deno.env.get("ASANA_PROJECT_ID");

const baseUrl = "https://app.asana.com/api/1.0";

const tasksFields = [
  "gid",
  "completed_at",
  "name",
  "tags",
  "external",
  "modified_at",
  "completed",
];
const tasksUrl =
  `https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=${
    tasksFields.join(",")
  }`;

const startDate = "2021-08-01";

const tagColorcodeMap: { [key: string]: string } = {
  "UI/UX": "#00D4C8",
  "改善": "#48DAFD",
  "顧客要望": "#FF7512",
  "feedback": "#FFA801",
  "ops": "#E8ECEE",
  "dev": "#FF78FF",
  "bug": "#FB5779",
  "security": "#48DAFD",
};

type Task = {
  gid: string;
  completed: boolean;
  "completed_at": string;
  "modified_at": string;
  name: string;
  tags: {
    gid: string;
    "resource_type": string;
  }[];
};

type Tag = {
  gid: string;
  name: string;
  color: string | null;
};

const getResponse = async (url: string) => {
  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const responseJson = await response.json();
  return responseJson.data;
};

const getTagsFromTasks = async (tasks: Task[]): Promise<Tag[]> => {
  const gids = tasks.flatMap((task) => task.tags.map((tags) => tags.gid));
  const uniqTagGids = [...new Set(gids)];
  const allTags = await Promise.all(uniqTagGids.map(async (gid) => {
    const tagUrl = `${baseUrl}/tags/${gid}?opt_fields=color,name,gid&limit=10`;
    const tag: Tag = await getResponse(tagUrl);
    return tag;
  }));
  return allTags;
};

const genTaskCounts = (
  days: dayjs.Dayjs[],
  tasks: Task[],
  tag?: Tag,
): number[] => {
  return days.map((day) => {
    const filterdTasks = tasks.filter((task) => {
      const isCompletedOnTheDay = dayjs(task.completed_at).isSame(day, "day");
      const isSameTag = tag
        ? task.tags[0]?.gid === tag.gid
        : task.tags.length === 0;
      return isCompletedOnTheDay && isSameTag;
    });
    return filterdTasks.length;
  });
};

type DataSet = {
  label: string;
  data: number[];
  backgroundColor: string;
};

const generageChartData = (
  startDateString: string,
  tasks: Task[],
  tags: Tag[],
): { labels: string[]; datasets: DataSet[] } => {
  const today = dayjs();
  const startDate = dayjs(startDateString);
  const numDays = today.diff(startDate, "day");
  const days = [...Array(numDays)].map((_, i) => startDate.add(i, "day"));
  const labels = [...Array(numDays)].map((_, i) =>
    startDate.add(i, "day").format("YYYY-MM-DD")
  );

  const datasets: DataSet[] = tags.map((tag) => {
    const data = genTaskCounts(days, tasks, tag);
    const backgroundColor = tagColorcodeMap[tag.name] || "#" +
        Math.floor(Math.random() * 16777215).toString(16);
    return { label: tag.name, data, backgroundColor };
  });

  const datasetWithoutTag: DataSet = {
    label: "no_tag",
    data: genTaskCounts(days, tasks),
    backgroundColor: "gray",
  };
  datasets.push(datasetWithoutTag);

  return { labels, datasets };
};

export const getChartData = async () => {
  const tasks: Task[] = await getResponse(tasksUrl);
  const tags = await getTagsFromTasks(tasks);
  const result = generageChartData(startDate, tasks, tags);

  return result;
};

export const getCompletedTaskNames = async (): Promise<string[]> => {
  const tasks: Task[] = await getResponse(tasksUrl);
  return tasks.filter((task) => task.completed).map((task) => task.name);
};

export default getChartData;
