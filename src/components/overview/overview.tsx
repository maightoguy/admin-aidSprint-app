import { useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleMore,
  MoreVertical,
  Settings,
  ShieldCheck,
  Users,
  UserSquare2,
  WalletCards,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import summaryCardPattern from "@/assets/overview/summary-card-pattern.png";

const totalRevenueIconSvg = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 6.25C9.50272 6.25 9.02581 6.44754 8.67417 6.79917C8.32254 7.15081 8.125 7.62772 8.125 8.125C8.125 8.62228 8.32254 9.09919 8.67417 9.45082C9.02581 9.80246 9.50272 10 10 10C10.4973 10 10.9742 9.80246 11.3258 9.45082C11.6775 9.09919 11.875 8.62228 11.875 8.125C11.875 7.62772 11.6775 7.15081 11.3258 6.79917C10.9742 6.44754 10.4973 6.25 10 6.25Z" fill="#EEF3E6"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 4.0625C1.25 3.19917 1.95 2.5 2.8125 2.5H17.1875C18.05 2.5 18.75 3.2 18.75 4.0625V12.1875C18.75 13.0508 18.05 13.75 17.1875 13.75H2.8125C2.60731 13.75 2.40413 13.7096 2.21456 13.6311C2.02499 13.5525 1.85274 13.4374 1.70765 13.2924C1.56255 13.1473 1.44746 12.975 1.36894 12.7854C1.29042 12.5959 1.25 12.3927 1.25 12.1875V4.0625ZM6.875 8.125C6.875 7.2962 7.20424 6.50134 7.79029 5.91529C8.37634 5.32924 9.1712 5 10 5C10.8288 5 11.6237 5.32924 12.2097 5.91529C12.7958 6.50134 13.125 7.2962 13.125 8.125C13.125 8.9538 12.7958 9.74866 12.2097 10.3347C11.6237 10.9208 10.8288 11.25 10 11.25C9.1712 11.25 8.37634 10.9208 7.79029 10.3347C7.20424 9.74866 6.875 8.9538 6.875 8.125ZM15.625 7.5C15.4592 7.5 15.3003 7.56585 15.1831 7.68306C15.0658 7.80027 15 7.95924 15 8.125V8.13167C15 8.47667 15.28 8.75667 15.625 8.75667H15.6317C15.7974 8.75667 15.9564 8.69082 16.0736 8.57361C16.1908 8.4564 16.2567 8.29743 16.2567 8.13167V8.125C16.2567 7.95924 16.1908 7.80027 16.0736 7.68306C15.9564 7.56585 15.7974 7.5 15.6317 7.5H15.625ZM3.75 8.125C3.75 7.95924 3.81585 7.80027 3.93306 7.68306C4.05027 7.56585 4.20924 7.5 4.375 7.5H4.38167C4.54743 7.5 4.7064 7.56585 4.82361 7.68306C4.94082 7.80027 5.00667 7.95924 5.00667 8.125V8.13167C5.00667 8.29743 4.94082 8.4564 4.82361 8.57361C4.7064 8.69082 4.54743 8.75667 4.38167 8.75667H4.375C4.20924 8.75667 4.05027 8.69082 3.93306 8.57361C3.81585 8.4564 3.75 8.29743 3.75 8.13167V8.125Z" fill="#EEF3E6"/>
<path d="M1.875 15C1.70924 15 1.55027 15.0658 1.43306 15.1831C1.31585 15.3003 1.25 15.4592 1.25 15.625C1.25 15.7908 1.31585 15.9497 1.43306 16.0669C1.55027 16.1842 1.70924 16.25 1.875 16.25C6.375 16.25 10.7333 16.8517 14.875 17.9792C15.8667 18.2492 16.875 17.5142 16.875 16.4625V15.625C16.875 15.4592 16.8092 15.3003 16.6919 15.1831C16.5747 15.0658 16.4158 15 16.25 15H1.875Z" fill="#9CA1AA"/>
</svg>

`;

const totalUsersIconSvg = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.875 5.625C6.875 4.7962 7.20424 4.00134 7.79029 3.41529C8.37634 2.82924 9.1712 2.5 10 2.5C10.8288 2.5 11.6237 2.82924 12.2097 3.41529C12.7958 4.00134 13.125 4.7962 13.125 5.625C13.125 6.4538 12.7958 7.24866 12.2097 7.83471C11.6237 8.42076 10.8288 8.75 10 8.75C9.1712 8.75 8.37634 8.42076 7.79029 7.83471C7.20424 7.24866 6.875 6.4538 6.875 5.625ZM13.125 8.125C13.125 7.46196 13.3884 6.82607 13.8572 6.35723C14.3261 5.88839 14.962 5.625 15.625 5.625C16.288 5.625 16.9239 5.88839 17.3928 6.35723C17.8616 6.82607 18.125 7.46196 18.125 8.125C18.125 8.78804 17.8616 9.42393 17.3928 9.89277C16.9239 10.3616 16.288 10.625 15.625 10.625C14.962 10.625 14.3261 10.3616 13.8572 9.89277C13.3884 9.42393 13.125 8.78804 13.125 8.125ZM1.875 8.125C1.875 7.46196 2.13839 6.82607 2.60723 6.35723C3.07607 5.88839 3.71196 5.625 4.375 5.625C5.03804 5.625 5.67393 5.88839 6.14277 6.35723C6.61161 6.82607 6.875 7.46196 6.875 8.125C6.875 8.78804 6.61161 9.42393 6.14277 9.89277C5.67393 10.3616 5.03804 10.625 4.375 10.625C3.71196 10.625 3.07607 10.3616 2.60723 9.89277C2.13839 9.42393 1.875 8.78804 1.875 8.125ZM5.25833 12.5975C5.76662 11.8009 6.46757 11.1452 7.29635 10.6912C8.12513 10.2372 9.05501 9.99947 10 10C10.7915 9.99928 11.5743 10.1657 12.297 10.4885C13.0197 10.8112 13.6661 11.2829 14.1939 11.8728C14.7217 12.4627 15.119 13.1574 15.3597 13.9114C15.6004 14.6654 15.6792 15.4618 15.5908 16.2483C15.58 16.3461 15.5463 16.4398 15.4925 16.5221C15.4386 16.6043 15.3661 16.6727 15.2808 16.7217C13.6738 17.6438 11.8528 18.1277 10 18.125C8.07917 18.125 6.275 17.615 4.71917 16.7217C4.63391 16.6727 4.5614 16.6043 4.50754 16.5221C4.45367 16.4398 4.41997 16.3461 4.40917 16.2483C4.26921 14.9705 4.56872 13.6831 5.25833 12.5983V12.5975Z" fill="#020715"/>
  </svg>
`;

const totalContractorsIconSvg = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.875 16.6667V15.1667C0.875 14.7083 0.993056 14.2778 1.22917 13.875C1.46528 13.4722 1.79167 13.1667 2.20833 12.9583C2.91667 12.5972 3.71528 12.2917 4.60417 12.0417C5.49306 11.7917 6.47222 11.6667 7.54167 11.6667C8.61111 11.6667 9.59028 11.7917 10.4792 12.0417C11.3681 12.2917 12.1667 12.5972 12.875 12.9583C13.2917 13.1667 13.6181 13.4722 13.8542 13.875C14.0903 14.2778 14.2083 14.7083 14.2083 15.1667V16.6667C14.2083 16.9028 14.1283 17.1008 13.9683 17.2608C13.8083 17.4208 13.6106 17.5006 13.375 17.5H1.70833C1.47222 17.5 1.27444 17.42 1.115 17.26C0.955556 17.1 0.875556 16.9022 0.875 16.6667ZM5.1875 9.85417C4.53472 9.20139 4.20833 8.41667 4.20833 7.5H4C3.875 7.5 3.77444 7.46194 3.69833 7.38583C3.62222 7.30972 3.58389 7.20889 3.58333 7.08333C3.58278 6.95778 3.62111 6.85694 3.69833 6.78083C3.77556 6.70472 3.87611 6.66667 4 6.66667H4.20833C4.20833 6.04167 4.36111 5.47917 4.66667 4.97917C4.97222 4.47917 5.375 4.08333 5.875 3.79167V4.58333C5.875 4.70833 5.91333 4.80917 5.99 4.88583C6.06667 4.9625 6.16722 5.00056 6.29167 5C6.41611 4.99944 6.51694 4.96139 6.59417 4.88583C6.67139 4.81028 6.70944 4.70944 6.70833 4.58333V3.45833C6.83333 3.41667 6.96528 3.38556 7.10417 3.365C7.24306 3.34444 7.38889 3.33389 7.54167 3.33333C7.69444 3.33278 7.84028 3.34333 7.97917 3.365C8.11806 3.38667 8.25 3.41778 8.375 3.45833V4.58333C8.375 4.70833 8.41333 4.80917 8.49 4.88583C8.56667 4.9625 8.66722 5.00056 8.79167 5C8.91611 4.99944 9.01694 4.96139 9.09417 4.88583C9.17139 4.81028 9.20944 4.70944 9.20833 4.58333V3.79167C9.70833 4.08333 10.1111 4.47917 10.4167 4.97917C10.7222 5.47917 10.875 6.04167 10.875 6.66667H11.0833C11.2083 6.66667 11.3092 6.705 11.3858 6.78167C11.4625 6.85833 11.5006 6.95889 11.5 7.08333C11.4994 7.20778 11.4614 7.30861 11.3858 7.38583C11.3103 7.46306 11.2094 7.50111 11.0833 7.5H10.875C10.875 8.41667 10.5486 9.20139 9.89583 9.85417C9.24306 10.5069 8.45833 10.8333 7.54167 10.8333C6.625 10.8333 5.84028 10.5069 5.1875 9.85417ZM8.71917 8.6775C9.04528 8.35083 9.20833 7.95833 9.20833 7.5H5.875C5.875 7.95833 6.03833 8.35083 6.365 8.6775C6.69167 9.00417 7.08389 9.16722 7.54167 9.16667C7.99944 9.16611 8.39194 9.00306 8.71917 8.6775ZM13.7292 12.1667L13.6667 11.875C13.5833 11.8472 13.5036 11.8161 13.4275 11.7817C13.3514 11.7472 13.2783 11.695 13.2083 11.625L12.9583 11.7083C12.8611 11.7361 12.7675 11.7361 12.6775 11.7083C12.5875 11.6806 12.5144 11.6181 12.4583 11.5208L12.375 11.375C12.3194 11.2917 12.3022 11.2014 12.3233 11.1042C12.3444 11.0069 12.3894 10.9236 12.4583 10.8542L12.6667 10.6667V10.1667L12.4583 9.97917C12.3889 9.90972 12.3439 9.82639 12.3233 9.72917C12.3028 9.63194 12.32 9.54167 12.375 9.45833L12.4583 9.3125C12.5139 9.21528 12.5869 9.15278 12.6775 9.125C12.7681 9.09722 12.8617 9.09722 12.9583 9.125L13.2083 9.20833C13.2639 9.15278 13.3333 9.10417 13.4167 9.0625C13.5 9.02083 13.5833 8.98611 13.6667 8.95833L13.7292 8.66667C13.7569 8.56944 13.8056 8.48944 13.875 8.42667C13.9444 8.36389 14.0278 8.33278 14.125 8.33333H14.2917C14.3889 8.33333 14.4722 8.36472 14.5417 8.4275C14.6111 8.49028 14.6597 8.57 14.6875 8.66667L14.75 8.95833C14.8333 8.98611 14.9167 9.02083 15 9.0625C15.0833 9.10417 15.1528 9.15278 15.2083 9.20833L15.4583 9.125C15.5556 9.09722 15.6494 9.09722 15.74 9.125C15.8306 9.15278 15.9033 9.21528 15.9583 9.3125L16.0417 9.45833C16.0972 9.54167 16.1147 9.63194 16.0942 9.72917C16.0736 9.82639 16.0283 9.90972 15.9583 9.97917L15.75 10.1667V10.6667L15.9583 10.8542C16.0278 10.9236 16.0731 11.0069 16.0942 11.1042C16.1153 11.2014 16.0978 11.2917 16.0417 11.375L15.9583 11.5208C15.9028 11.6181 15.83 11.6806 15.74 11.7083C15.65 11.7361 15.5561 11.7361 15.4583 11.7083L15.2083 11.625C15.1389 11.6944 15.0661 11.7467 14.99 11.7817C14.9139 11.8167 14.8339 11.8478 14.75 11.875L14.6875 12.1667C14.6597 12.2639 14.6111 12.3439 14.5417 12.4067C14.4722 12.4694 14.3889 12.5006 14.2917 12.5H14.125C14.0278 12.5 13.9444 12.4689 13.875 12.4067C13.8056 12.3444 13.7569 12.2644 13.7292 12.1667ZM14.6458 10.8542C14.7708 10.7292 14.8333 10.5833 14.8333 10.4167C14.8333 10.25 14.7708 10.1042 14.6458 9.97917C14.5208 9.85417 14.375 9.79167 14.2083 9.79167C14.0417 9.79167 13.8958 9.85417 13.7708 9.97917C13.6458 10.1042 13.5833 10.25 13.5833 10.4167C13.5833 10.5833 13.6458 10.7292 13.7708 10.8542C13.8958 10.9792 14.0417 11.0417 14.2083 11.0417C14.375 11.0417 14.5208 10.9792 14.6458 10.8542ZM15.625 7.875L15.5417 7.45833C15.4167 7.41667 15.3019 7.36472 15.1975 7.3025C15.0931 7.24028 14.9994 7.16722 14.9167 7.08333L14.4792 7.22917C14.3542 7.27083 14.2292 7.2675 14.1042 7.21917C13.9792 7.17083 13.8819 7.09083 13.8125 6.97917L13.6875 6.77083C13.6181 6.65972 13.5936 6.53833 13.6142 6.40667C13.6347 6.275 13.7008 6.16028 13.8125 6.0625L14.1667 5.75C14.1389 5.68056 14.125 5.625 14.125 5.58333V5.25C14.125 5.20833 14.1389 5.15278 14.1667 5.08333L13.8125 4.77083C13.7014 4.67361 13.6353 4.55889 13.6142 4.42667C13.5931 4.29444 13.6175 4.17306 13.6875 4.0625L13.8125 3.85417C13.8819 3.74306 13.9792 3.66306 14.1042 3.61417C14.2292 3.56528 14.3542 3.56194 14.4792 3.60417L14.9167 3.75C15 3.66667 15.0939 3.59389 15.1983 3.53167C15.3028 3.46944 15.4172 3.41722 15.5417 3.375L15.625 2.95833C15.6528 2.81944 15.7189 2.70833 15.8233 2.625C15.9278 2.54167 16.0492 2.5 16.1875 2.5H16.3958C16.5347 2.5 16.6564 2.54167 16.7608 2.625C16.8653 2.70833 16.9311 2.81944 16.9583 2.95833L17.0417 3.375C17.1667 3.41667 17.2814 3.46889 17.3858 3.53167C17.4903 3.59444 17.5839 3.66722 17.6667 3.75L18.1042 3.60417C18.2292 3.5625 18.3542 3.56611 18.4792 3.615C18.6042 3.66389 18.7014 3.74361 18.7708 3.85417L18.8958 4.0625C18.9653 4.17361 18.9897 4.29528 18.9692 4.4275C18.9486 4.55972 18.8825 4.67417 18.7708 4.77083L18.4167 5.08333C18.4444 5.15278 18.4583 5.20833 18.4583 5.25V5.58333C18.4583 5.625 18.4444 5.68056 18.4167 5.75L18.7708 6.0625C18.8819 6.15972 18.9481 6.27444 18.9692 6.40667C18.9903 6.53889 18.9658 6.66028 18.8958 6.77083L18.7708 6.97917C18.7014 7.09028 18.6042 7.17028 18.4792 7.21917C18.3542 7.26806 18.2292 7.27139 18.1042 7.22917L17.6667 7.08333C17.5833 7.16667 17.4897 7.23944 17.3858 7.30167C17.2819 7.36389 17.1672 7.41611 17.0417 7.45833L16.9583 7.875C16.9306 8.01389 16.8644 8.125 16.76 8.20833C16.6556 8.29167 16.5342 8.33333 16.3958 8.33333H16.1875C16.0486 8.33333 15.9272 8.29167 15.8233 8.20833C15.7194 8.125 15.6533 8.01389 15.625 7.875ZM17.0317 6.15667C17.2328 5.955 17.3333 5.70833 17.3333 5.41667C17.3333 5.125 17.2325 4.87833 17.0308 4.67667C16.8292 4.475 16.5828 4.37444 16.2917 4.375C16.0006 4.37556 15.7539 4.47639 15.5517 4.6775C15.3494 4.87861 15.2489 5.125 15.25 5.41667C15.2511 5.70833 15.3519 5.955 15.5525 6.15667C15.7531 6.35833 15.9994 6.45889 16.2917 6.45833C16.5839 6.45778 16.8306 6.35778 17.0317 6.15667Z" fill="#020715"/>
</svg>

`;

const totalRequestsIconSvg = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.6875 1.25C3.82417 1.25 3.125 1.95 3.125 2.8125V17.1875C3.125 18.05 3.825 18.75 4.6875 18.75H15.3125C16.175 18.75 16.875 18.05 16.875 17.1875V10.625C16.875 9.7962 16.5458 9.00134 15.9597 8.41529C15.3737 7.82924 14.5788 7.5 13.75 7.5H12.1875C11.7731 7.5 11.3757 7.33538 11.0826 7.04235C10.7896 6.74933 10.625 6.3519 10.625 5.9375V4.375C10.625 3.5462 10.2958 2.75134 9.70971 2.16529C9.12366 1.57924 8.3288 1.25 7.5 1.25H4.6875Z" fill="#020715"/>
<path d="M10.8092 1.51343C11.498 2.30756 11.8765 3.32388 11.875 4.37509V5.93759C11.875 6.11009 12.015 6.25009 12.1875 6.25009H13.75C14.8012 6.24863 15.8176 6.62716 16.6117 7.31593C16.2451 5.92152 15.5146 4.64951 14.4951 3.63C13.4756 2.61049 12.2036 1.88006 10.8092 1.51343Z" fill="#020715"/>
</svg>


`;

const totalRevenuePattern = summaryCardPattern;
const requestsCardPattern = summaryCardPattern;

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/overview" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Contractors", icon: UserSquare2 },
  { label: "Requests", icon: FileText },
  { label: "Transaction", icon: WalletCards },
  { label: "Support", icon: MessageCircleMore },
  { label: "Settings", icon: Settings },
];

const statistics = [
  {
    title: "Total Revenue",
    value: "$15,837",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalRevenueIconSvg,
    highlighted: true,
    patternSrc: totalRevenuePattern,
    patternClassName:
      "absolute -left-[27px] -top-[14px] hidden h-[156px] w-[318px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total users",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalUsersIconSvg,
    patternSrc: summaryCardPattern,
    patternClassName:
      "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total Contractors",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalContractorsIconSvg,
    patternSrc: summaryCardPattern,
    patternClassName:
      "absolute -left-[25px] -top-[14px] hidden h-[156px] w-[317px] max-w-none rotate-180 opacity-80 lg:block",
  },
  {
    title: "Total Request",
    value: "100,000",
    trend: "+ 2.3% vs Yesterday",
    iconSvg: totalRequestsIconSvg,
    patternSrc: requestsCardPattern,
    patternClassName:
      "absolute -left-[81px] -top-[14px] hidden h-[156px] w-[428px] max-w-none rotate-180 opacity-80 lg:block",
  },
];

const revenueBars = [
  { month: "Jan", shortMonth: "J", fullMonth: "January", value: 82 },
  { month: "Feb", shortMonth: "F", fullMonth: "February", value: 42 },
  {
    month: "Mar",
    shortMonth: "M",
    fullMonth: "March",
    value: 68,
    active: true,
  },
  { month: "Apr", shortMonth: "A", fullMonth: "April", value: 53 },
  { month: "May", shortMonth: "M", fullMonth: "May", value: 74 },
  { month: "Jun", shortMonth: "J", fullMonth: "June", value: 61 },
  { month: "Jul", shortMonth: "J", fullMonth: "July", value: 80 },
  { month: "Aug", shortMonth: "A", fullMonth: "August", value: 58 },
  { month: "Sep", shortMonth: "S", fullMonth: "September", value: 47 },
  { month: "Oct", shortMonth: "O", fullMonth: "October", value: 56 },
  { month: "Nov", shortMonth: "N", fullMonth: "November", value: 66 },
  { month: "Dec", shortMonth: "D", fullMonth: "December", value: 54 },
];

type TopService = {
  label: string;
  amount: number;
  color: string;
};

const topServices: TopService[] = [
  { label: "Plumber", amount: 6000000, color: "#22C55E" },
  { label: "Electrician", amount: 5200000, color: "#22B8CF" },
  { label: "Cleaning", amount: 3400000, color: "#8B5CF6" },
  { label: "Title", amount: 4100000, color: "#EC4899" },
];

const pieChartSize = 168;
const pieChartRadius = pieChartSize / 2;
const pieChartCenter = pieChartSize / 2;
const pieTooltipOffset = 24;
const pieTooltipBounds = {
  minX: 28,
  maxX: pieChartSize - 28,
  minY: 24,
  maxY: pieChartSize - 24,
};

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString("en-US")}`;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function buildPieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const requests = [
  {
    name: "Emery Torff",
    email: "thekdfisher@email.com",
    service: "Plumbing",
    location: "163 Owode-Sango Road",
    date: "Apr 12, 2023",
    status: "Active",
  },
  {
    name: "Maren Dokidis",
    email: "thekdfisher@email.com",
    service: "Cleaning",
    location: "34 Awgu-Mgbidi Road",
    date: "Apr 12, 2023",
    status: "Pending",
  },
  {
    name: "Cooper Siphron",
    email: "thekdfisher@email.com",
    service: "Baby sitting",
    location: "170 Ejigbo-Apomu Road",
    date: "Apr 12, 2023",
    status: "Active",
  },
  {
    name: "Marcus Dias",
    email: "thekdfisher@email.com",
    service: "Electrician",
    location: "178 Omu-Aran Township",
    date: "Apr 12, 2023",
    status: "Pending",
  },
  {
    name: "Ahmad Stanton",
    email: "thekdfisher@email.com",
    service: "Plumbing",
    location: "113 Gashua-Bursari Road",
    date: "Apr 12, 2023",
    status: "Active",
  },
];

const notificationGroups = [
  {
    label: "Today",
    items: [
      {
        id: "new-request",
        title: "New request",
        preview:
          "Lorem ipsum dolor sit amet consectetur. Id nulla tristique vitae sapien ut egestas.",
        time: "2h ago",
      },
      {
        id: "lorem-consectetur",
        title: "Lorem ipsum dolor sit amet consectetur. Non sit nullam.",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
      {
        id: "request-submitted",
        title: "Investment request submitted",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
    ],
  },
  {
    label: "Yesterday",
    items: [
      {
        id: "lorem-yesterday",
        title: "Lorem ipsum",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
      {
        id: "new-contractor",
        title: "New contractor sign up",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
      {
        id: "announcements",
        title: "Announcements",
        preview: "Lorem ipsum dolor sit amet consectetur.",
        time: "08:00am",
      },
    ],
  },
];

function AidSprintLogo() {
  return (
    <div className="flex items-center gap-2 text-white">
      <span className="text-[18px] font-bold tracking-[-0.03em]">
        AidSprint
      </span>
      <div className="flex items-center gap-[2px]">
        <span className="h-5 w-[6px] skew-x-[-24deg] rounded-sm bg-[#FF2F3C]" />
        <span className="h-5 w-[6px] skew-x-[-24deg] rounded-sm bg-[#FF2F3C]" />
        <span className="h-5 w-[6px] skew-x-[-24deg] rounded-sm bg-[#FF2F3C]" />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === "Active";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
        isActive
          ? "bg-[#DCFCE7] text-[#22A75A]"
          : "bg-[#FFF4DB] text-[#F59E0B]",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function Sidebar({
  mobile,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside
      className={[
        "flex h-full flex-col bg-[linear-gradient(180deg,#072165_0%,#051742_100%)] text-white",
        mobile
          ? "w-[88vw] max-w-[312px] rounded-r-[28px] shadow-[0_28px_70px_rgba(2,12,37,0.45)]"
          : "w-[196px] border-r border-white/10",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-6 pb-6 pt-7">
        <AidSprintLogo />
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const baseClassName =
            "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition";

          if (item.path) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={mobile ? onClose : undefined}
                className={({ isActive }) =>
                  [
                    baseClassName,
                    isActive
                      ? "bg-[#05163E] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                      : "text-white/65 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={[
                baseClassName,
                "cursor-not-allowed text-white/45",
              ].join(" ")}
              aria-disabled="true"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-8 flex items-center gap-3 px-4 pb-6 pt-4">
        <div className="relative h-12 w-12 shrink-0 rounded-full bg-[linear-gradient(135deg,#F8D7BC_0%,#A85B39_100%)]">
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#051742] bg-[#22C55E]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            Alison Eyo
          </p>
          <p className="truncate text-xs text-[#94A3B8]">alison.@rayna.ui</p>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-[#FF5F77] transition hover:bg-white/10"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

export default function Overview() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] =
    useState("new-request");
  const [hoveredServiceLabel, setHoveredServiceLabel] = useState<string | null>(
    null,
  );

  const totalTopServicesAmount = topServices.reduce(
    (total, service) => total + service.amount,
    0,
  );

  let currentAngle = 0;
  const pieSegments = topServices.map((service) => {
    const angle = (service.amount / totalTopServicesAmount) * 360;
    const startAngle = currentAngle;
    const endAngle = startAngle + angle;
    const middleAngle = startAngle + angle / 2;
    const tooltipAnchor = polarToCartesian(
      pieChartCenter,
      pieChartCenter,
      pieChartRadius + pieTooltipOffset,
      middleAngle,
    );

    currentAngle = endAngle;

    return {
      ...service,
      value: formatCurrency(service.amount),
      path: buildPieSlicePath(
        pieChartCenter,
        pieChartCenter,
        pieChartRadius,
        startAngle,
        endAngle,
      ),
      tooltipX: clamp(
        tooltipAnchor.x,
        pieTooltipBounds.minX,
        pieTooltipBounds.maxX,
      ),
      tooltipY: clamp(
        tooltipAnchor.y,
        pieTooltipBounds.minY,
        pieTooltipBounds.maxY,
      ),
    };
  });

  const hoveredService =
    pieSegments.find((segment) => segment.label === hoveredServiceLabel) ??
    null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F8FB] text-[#101828]">
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-[#020617]/45 backdrop-blur-[2px] lg:hidden">
          <Sidebar mobile onClose={() => setIsSidebarOpen(false)} />
        </div>
      ) : null}
      {isNotificationsOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.16)] backdrop-blur-md">
          <div className="flex h-full justify-end">
            <div className="flex h-full w-full max-w-[420px] flex-col overflow-y-auto rounded-none bg-white px-5 pb-6 pt-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0F172A]">
                    Notifications
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="rounded-full p-2 text-[#475467] transition hover:bg-[#F3F4F6]"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-6">
                {notificationGroups.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                      {group.label}
                    </p>
                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const expanded = expandedNotificationId === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setExpandedNotificationId(expanded ? "" : item.id)
                            }
                            className="w-full rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] p-4 text-left transition hover:border-[#D0D5DD] hover:bg-white"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#071B58] text-white">
                                <Bell className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-semibold text-[#111827]">
                                    {item.title}
                                  </p>
                                  <ChevronDown
                                    className={[
                                      "mt-0.5 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform",
                                      expanded ? "rotate-180" : "",
                                    ].join(" ")}
                                  />
                                </div>
                                <p
                                  className={[
                                    "mt-1 text-sm leading-6 text-[#667085]",
                                    expanded ? "" : "line-clamp-1",
                                  ].join(" ")}
                                >
                                  {item.preview}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#98A2B3]">
                                  {item.time}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-5 lg:pb-8 lg:pt-7">
            <div className="mb-5 flex flex-col gap-4 border-b border-[#EAECF0] pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-xl border border-[#E4E7EC] bg-white p-2.5 text-[#344054] shadow-sm transition hover:bg-[#F8FAFC] lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[24px] font-bold tracking-[-0.03em] text-[#101828] lg:text-[28px]">
                    Dashboard
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#EAECF0] bg-white px-4 py-2.5 text-sm font-medium text-[#667085] shadow-sm transition hover:bg-[#F8FAFC]"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>All time</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#667085] shadow-sm transition hover:bg-[#F8FAFC]"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-[11px] top-[11px] h-2.5 w-2.5 rounded-full border-2 border-white bg-[#F04438]" />
                </button>
                <div className="inline-flex items-center gap-3 rounded-xl border border-[#EAECF0] bg-white px-4 py-2.5 shadow-sm">
                  <span className="text-sm font-medium text-[#667085]">
                    System Status:
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#12B76A]">
                    <span className="h-2 w-2 rounded-full bg-[#12B76A]" />
                    Active
                  </span>
                </div>
              </div>
            </div>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[14px]">
              {statistics.map((item) => (
                <article
                  key={item.title}
                  className={[
                    "relative overflow-hidden rounded-[10px] border p-[13px] shadow-sm",
                    item.highlighted
                      ? "border-[#07133A] bg-[linear-gradient(135deg,#020817_0%,#041B5C_100%)] text-white"
                      : "border-[#F0F1F2] bg-[#FAFAFA] text-[#101828]",
                  ].join(" ")}
                >
                  <img
                    src={item.patternSrc}
                    alt=""
                    aria-hidden="true"
                    className={item.patternClassName}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={[
                          "truncate text-[14px] leading-[19px]",
                          item.highlighted
                            ? "text-[#EEF3E6]"
                            : "text-[#6B7280]",
                        ].join(" ")}
                      >
                        {item.title}
                      </p>
                      <p
                        className={[
                          "mt-[10px] text-[24px] font-semibold leading-[33px] tracking-[-0.02em]",
                          item.highlighted ? "text-white" : "text-[#020715]",
                        ].join(" ")}
                      >
                        {item.value}
                      </p>
                      <p
                        className={[
                          "mt-[8px] text-[12px] leading-[15px]",
                          item.highlighted
                            ? "text-[#B1B5C0]"
                            : "text-[#136C34]",
                        ].join(" ")}
                      >
                        {item.trend}
                      </p>
                    </div>
                    <div
                      className={[
                        "relative flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] border p-[3px] [&_svg]:h-5 [&_svg]:w-5",
                        item.highlighted
                          ? "border-[#36415C] bg-[#02091C]"
                          : "border-[#F0F1F2] bg-white",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: item.iconSvg }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <article className="rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[#667085]">
                      Revenue
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#EAECF0] px-2.5 py-1.5 text-xs font-semibold text-[#667085]"
                  >
                    Monthly
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 sm:gap-4">
                  <div className="flex h-[250px] flex-col justify-between pb-6 text-[11px] font-medium text-[#98A2B3]">
                    <span>$10K</span>
                    <span>$8K</span>
                    <span>$6K</span>
                    <span>$4K</span>
                    <span>$2K</span>
                    <span>$0</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 grid grid-rows-5 gap-0">
                      {[0, 1, 2, 3, 4].map((line) => (
                        <div
                          key={line}
                          className="border-t border-dashed border-[#E4E7EC]"
                        />
                      ))}
                    </div>
                    <div className="relative flex h-[250px] items-end gap-1 pt-10 min-[420px]:gap-1.5 sm:gap-3">
                      {revenueBars.map((bar) => (
                        <div
                          key={bar.month}
                          className="relative flex min-w-0 flex-1 flex-col items-center justify-end gap-3"
                        >
                          {bar.active ? (
                            <div className="absolute left-1/2 top-[6px] -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-center shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
                              <p className="whitespace-nowrap text-[11px] font-medium text-[#667085]">
                                Mar. 7th 2025
                              </p>
                              <p className="whitespace-nowrap text-xs font-bold text-[#101828]">
                                ₦6,0000
                              </p>
                            </div>
                          ) : null}
                          <div className="flex h-[170px] items-end">
                            <div
                              className={[
                                "w-3 rounded-t-full sm:w-4",
                                bar.active ? "bg-[#071B58]" : "bg-[#F2F4F7]",
                              ].join(" ")}
                              style={{ height: `${bar.value}%` }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-medium tracking-[-0.01em] text-[#98A2B3] sm:text-[11px]"
                            title={bar.fullMonth}
                          >
                            <span className="sr-only">{bar.fullMonth}</span>
                            <span aria-hidden="true" className="sm:hidden">
                              {bar.shortMonth}
                            </span>
                            <span
                              aria-hidden="true"
                              className="hidden sm:inline"
                            >
                              {bar.month}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
              <article className="rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-[#667085]">
                    Top services
                  </h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#EAECF0] px-2.5 py-1.5 text-xs font-semibold text-[#667085]"
                  >
                    All time
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
                  <div
                    className="relative flex h-[220px] w-[220px] items-center justify-center"
                    onMouseLeave={() => setHoveredServiceLabel(null)}
                  >
                    <svg
                      viewBox={`0 0 ${pieChartSize} ${pieChartSize}`}
                      className="h-[168px] w-[168px] overflow-visible"
                      role="img"
                      aria-label="Top services distribution"
                    >
                      {pieSegments.map((segment) => {
                        const isHovered =
                          hoveredService?.label === segment.label;

                        return (
                          <path
                            key={segment.label}
                            d={segment.path}
                            fill={segment.color}
                            stroke="#FFFFFF"
                            strokeWidth={isHovered ? 4 : 3}
                            className="cursor-pointer transition-all duration-200 ease-out"
                            style={{
                              filter: isHovered
                                ? "drop-shadow(0 10px 20px rgba(15, 23, 42, 0.18))"
                                : "none",
                              transform: isHovered ? "scale(1.03)" : "scale(1)",
                              transformOrigin: `${pieChartCenter}px ${pieChartCenter}px`,
                            }}
                            onMouseEnter={() =>
                              setHoveredServiceLabel(segment.label)
                            }
                            onFocus={() =>
                              setHoveredServiceLabel(segment.label)
                            }
                            onBlur={() => setHoveredServiceLabel(null)}
                            tabIndex={0}
                            aria-label={`${segment.label} ${segment.value}`}
                          />
                        );
                      })}
                    </svg>
                    <div
                      className={[
                        "pointer-events-none absolute z-10 rounded-xl bg-white px-4 py-3 shadow-[0_16px_32px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out",
                        hoveredService
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95",
                      ].join(" ")}
                      style={{
                        left: hoveredService
                          ? `${hoveredService.tooltipX}px`
                          : "50%",
                        top: hoveredService
                          ? `${hoveredService.tooltipY}px`
                          : "40px",
                        transform: hoveredService
                          ? "translate(-50%, -115%)"
                          : "translate(-50%, -115%)",
                      }}
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#667085]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: hoveredService?.color ?? "#22C55E",
                          }}
                        />
                        {hoveredService?.label ?? ""}
                      </div>
                      <p className="mt-1 whitespace-nowrap text-sm font-bold text-[#101828]">
                        {hoveredService?.value ?? ""}
                      </p>
                      <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-white" />
                    </div>
                  </div>
                  <div className="w-full space-y-3">
                    {topServices.map((service) => (
                      <div
                        key={service.label}
                        className={[
                          "flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 transition-colors duration-200",
                          hoveredService?.label === service.label
                            ? "bg-[#F8FAFC]"
                            : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ background: service.color }}
                          />
                          <span className="whitespace-nowrap text-sm font-medium text-[#667085]">
                            {service.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>
            <section className="mt-5 rounded-2xl border border-[#EAECF0] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-4 py-4 sm:px-5">
                <h2 className="text-sm font-semibold text-[#667085]">
                  Recent requests
                </h2>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#667085] transition hover:text-[#101828]"
                >
                  See all
                </button>
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-[#EAECF0]">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="text-left text-xs font-semibold text-[#667085]">
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Service</th>
                      <th className="px-5 py-4">Location</th>
                      <th className="px-5 py-4">Date and time</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0]">
                    {requests.map((request) => (
                      <tr key={request.name}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                              {request.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#101828]">
                                {request.name}
                              </p>
                              <p className="truncate text-xs text-[#98A2B3]">
                                {request.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#101828]">
                          {request.service}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#667085]">
                          {request.location}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#667085]">
                          {request.date}
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill status={request.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            className="rounded-xl border border-[#EAECF0] p-2 text-[#667085] transition hover:bg-[#F8FAFC]"
                            aria-label={`More actions for ${request.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 p-4 md:hidden">
                {requests.map((request) => (
                  <article
                    key={request.name}
                    className="rounded-2xl border border-[#EAECF0] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#344054]">
                          {request.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#101828]">
                            {request.name}
                          </p>
                          <p className="truncate text-xs text-[#98A2B3]">
                            {request.email}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={request.status} />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[#667085] sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-[#101828]">
                          Service:
                        </span>{" "}
                        {request.service}
                      </p>
                      <p>
                        <span className="font-semibold text-[#101828]">
                          Date:
                        </span>{" "}
                        {request.date}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-semibold text-[#101828]">
                          Location:
                        </span>{" "}
                        {request.location}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#EAECF0] px-4 py-4 sm:px-5">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC]"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {[1, 2, 3, 4, 5, 6].map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={[
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                      page === 3
                        ? "border border-[#101828] bg-white text-[#101828]"
                        : "text-[#98A2B3] hover:bg-[#F8FAFC] hover:text-[#344054]",
                    ].join(" ")}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#667085] transition hover:bg-[#F8FAFC]"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
