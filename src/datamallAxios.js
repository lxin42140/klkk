import axios from "axios";

const datamallAxios = axios.create({
  baseURL: "http://datamall2.mytransport.sg/ltaodataservice/",
});

export default datamallAxios;
