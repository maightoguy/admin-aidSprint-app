import { toast } from "sonner";
import {
  Baby,
  Brush,
  Hammer,
  HeartPulse,
  Info,
  Lock,
  PawPrint,
  Search,
  PlugZap,
  Wrench,
  LogOut,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/shared/dashboard-layout";
import {
  IntegrationToggle,
  type IntegrationToggleId,
} from "./integration-toggle";
import { SecurityForm, type SecurityFormValues } from "./security-form";

type SettingsTab = "integrations" | "security";

const integrationsCatalog: Array<{
  id: IntegrationToggleId;
  label: string;
  icon: ReactNode;
}> = [
  {
    id: "cleaning",
    label: "Cleaning",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <path
          d="M30.0585 29.3152C27.9556 28.283 26.75 26.0733 26.75 23.2495V21.6267C26.7508 21.3262 26.661 21.0324 26.4922 20.7837C26.3235 20.535 26.0837 20.343 25.8041 20.2327L23.1181 19.1583C22.9341 19.0846 22.7867 18.9411 22.7082 18.7591C22.6297 18.5771 22.6264 18.3715 22.6991 18.187L24.7916 12.8742C25.25 11.6986 24.6875 10.3317 23.5006 9.89111C22.9482 9.68565 22.3371 9.7052 21.7989 9.94556C21.2607 10.1859 20.8383 10.6279 20.6225 11.1764L18.5235 16.507C18.4873 16.599 18.4333 16.6829 18.3646 16.7539C18.2959 16.8249 18.2138 16.8816 18.1232 16.9208C18.0325 16.96 17.9349 16.9809 17.8361 16.9823C17.7374 16.9837 17.6393 16.9656 17.5475 16.9289L14.8541 15.8508C14.5792 15.7395 14.2773 15.7127 13.9871 15.7738C13.6968 15.835 13.4314 15.9812 13.2247 16.1939C11.2513 18.2245 10.25 20.5974 10.25 23.2495C10.2449 25.9592 11.2918 28.5651 13.1703 30.518C13.2413 30.5917 13.3265 30.6502 13.4208 30.6901C13.5151 30.7299 13.6164 30.7501 13.7188 30.7495H29.75C29.9412 30.7499 30.1253 30.6772 30.2647 30.5464C30.4041 30.4155 30.4883 30.2363 30.5 30.0455C30.5067 29.8938 30.4683 29.7435 30.3897 29.6135C30.3112 29.4836 30.1959 29.3798 30.0585 29.3152ZM18.7916 29.2495C17.6819 28.185 16.8939 26.8301 16.5172 25.3392C16.4718 25.1514 16.3574 24.9876 16.1967 24.8803C16.036 24.773 15.8409 24.73 15.65 24.7599C15.5484 24.7782 15.4516 24.8174 15.3658 24.8749C15.2799 24.9324 15.2069 25.007 15.1513 25.0941C15.0957 25.1811 15.0586 25.2787 15.0425 25.3808C15.0264 25.4828 15.0315 25.5871 15.0575 25.687C15.385 26.9785 15.9705 28.1904 16.7788 29.2495H14.0413C12.5627 27.6012 11.7465 25.4639 11.75 23.2495C11.7407 22.0759 11.988 20.9144 12.4747 19.8464L25.3935 25.0149C25.6747 26.708 26.3825 28.1555 27.4456 29.2514L18.7916 29.2495Z"
          fill="#041133"
        />
      </svg>
    ),
  },
  {
    id: "psw-care",
    label: "PSW care",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <path
          d="M20.934 29.612L20.942 29.606L20.963 29.591L21.043 29.533C21.1123 29.483 21.2107 29.41 21.338 29.314C22.824 28.1924 24.2267 26.9645 25.535 25.64C26.683 24.472 27.85 23.107 28.734 21.659C29.614 20.219 30.25 18.635 30.25 17.047C30.25 15.162 29.665 13.689 28.63 12.689C27.6 11.695 26.21 11.25 24.75 11.25C23.025 11.25 21.502 12.083 20.5 13.367C19.498 12.083 17.974 11.25 16.25 11.25C13.17 11.25 10.75 13.889 10.75 17.047C10.75 18.635 11.387 20.218 12.266 21.659C13.15 23.107 14.317 24.472 15.465 25.641C16.8598 27.0521 18.3616 28.3534 19.957 29.533L20.037 29.591L20.058 29.606L20.066 29.612C20.1927 29.7018 20.3442 29.75 20.4995 29.75C20.6548 29.75 20.8063 29.7018 20.933 29.612M20.5 17.75C20.6989 17.75 20.8897 17.829 21.0303 17.9697C21.171 18.1103 21.25 18.3011 21.25 18.5V19.75H22.5C22.6989 19.75 22.8897 19.829 23.0303 19.9697C23.171 20.1103 23.25 20.3011 23.25 20.5C23.25 20.6989 23.171 20.8897 23.0303 21.0303C22.8897 21.171 22.6989 21.25 22.5 21.25H21.25V22.5C21.25 22.6989 21.171 22.8897 21.0303 23.0303C20.8897 23.171 20.6989 23.25 20.5 23.25C20.3011 23.25 20.1103 23.171 19.9697 23.0303C19.829 22.8897 19.75 22.6989 19.75 22.5V21.25H18.5C18.3011 21.25 18.1103 21.171 17.9697 21.0303C17.829 20.8897 17.75 20.6989 17.75 20.5C17.75 20.3011 17.829 20.1103 17.9697 19.9697C18.1103 19.829 18.3011 19.75 18.5 19.75H19.75V18.5C19.75 18.3011 19.829 18.1103 19.9697 17.9697C20.1103 17.829 20.3011 17.75 20.5 17.75Z"
          fill="#041133"
        />
      </svg>
    ),
  },
  {
    id: "plumbing",
    label: "Plumbing",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <path
          d="M19.7499 9.34375C19.5624 9.34375 19.3749 9.53125 18.9999 9.90625V11.4062H16.7252C15.9999 10.6562 15.9999 10.6562 15.2499 11.4062C14.4999 12.1562 14.4999 12.1562 15.2499 12.9062C15.9999 13.6562 15.9999 13.6562 16.6923 12.9062H18.9999V14.4062H20.4999V12.9062H22.7829C23.5237 13.6562 23.5235 13.6562 24.2735 12.9062C25.0235 12.1562 25.0235 12.1562 24.2735 11.4062C23.5235 10.6562 23.5237 10.6562 22.7499 11.4062H20.4999V9.90625C20.1249 9.53125 19.9374 9.34375 19.7499 9.34375ZM9.99994 13V25H11.4999V13H9.99994ZM12.9999 15.25L12.2499 14.5V23.5L12.9999 22.75V15.25ZM19.7499 15.1562C18.2499 15.1562 17.4835 15.1562 17.4423 16.6562H13.7499V21.1562H16.7792C17.4999 21.9062 18.2499 22.6562 19.7499 22.6562C21.2499 22.6562 21.9999 21.9062 22.7499 21.1562C25.7499 21.1562 25.7499 21.1562 25.7499 22.6562V24.1562H30.2499V21.1562C30.2499 18.1562 28.7499 16.6562 25.7499 16.6562H21.9999C22.0163 15.1562 21.2499 15.1562 19.7499 15.1562ZM24.9999 24.9062V25.6562H30.9999V24.9062H24.9999ZM27.9999 26.4062C27.9999 26.4062 26.1801 28.8278 26.4999 30.25C26.6978 31.1294 27.0985 31.6562 27.9999 31.6562C28.9013 31.6562 29.3021 31.1294 29.4999 30.25C29.8198 28.8278 27.9999 26.4062 27.9999 26.4062Z"
          fill="#041133"
        />
      </svg>
    ),
  },
  {
    id: "locksmith",
    label: "Locksmith",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <path
          d="M25 18V16C25 13.2 22.8 11 20 11C17.2 11 15 13.2 15 16V18C13.3 18 12 19.3 12 21V28C12 29.7 13.3 31 15 31H25C26.7 31 28 29.7 28 28V21C28 19.3 26.7 18 25 18ZM17 16C17 14.3 18.3 13 20 13C21.7 13 23 14.3 23 16V18H17V16ZM21.1 24.5L21 24.6V26C21 26.6 20.6 27 20 27C19.4 27 19 26.6 19 26V24.6C18.4 24 18.3 23.1 18.9 22.5C19.5 21.9 20.4 21.8 21 22.4C21.6 22.9 21.7 23.9 21.1 24.5Z"
          fill="#041133"
        />
      </svg>
    ),
  },
  {
    id: "electrician",
    label: "Electrician",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M15.035 21.6425C15.516 22.2305 16.74 24.409 17 25.5H24C24.26 24.41 25.4825 22.2315 25.9635 21.644C26.7854 20.6413 27.3029 19.4241 27.4545 18.1365C27.6041 16.8514 27.3804 15.5503 26.81 14.389C26.2346 13.2188 25.3393 12.2357 24.228 11.5535C23.1073 10.8637 21.817 10.499 20.501 10.5C19.1825 10.5 17.8905 10.865 16.774 11.5525C15.6624 12.2344 14.7668 13.2174 14.191 14.3875C13.6204 15.5484 13.3961 16.849 13.545 18.134C13.6945 19.4175 14.211 20.634 15.035 21.6425ZM21 14.5L18 19H20V22L23 17.5H21V14.5Z"
          fill="#041133"
        />
        <path
          d="M17 27C17 26.8674 17.0527 26.7402 17.1464 26.6464C17.2402 26.5527 17.3674 26.5 17.5 26.5H23.5C23.6326 26.5 23.7598 26.5527 23.8536 26.6464C23.9473 26.7402 24 26.8674 24 27C24 27.1326 23.9473 27.2598 23.8536 27.3536C23.7598 27.4473 23.6326 27.5 23.5 27.5H17.5C17.3674 27.5 17.2402 27.4473 17.1464 27.3536C17.0527 27.2598 17 27.1326 17 27ZM24 28.5H17V29.5C17 29.7652 17.1054 30.0196 17.2929 30.2071C17.4804 30.3946 17.7348 30.5 18 30.5H23C23.2652 30.5 23.5196 30.3946 23.7071 30.2071C23.8946 30.0196 24 29.7652 24 29.5V28.5Z"
          fill="#041133"
        />
      </svg>
    ),
  },
  {
    id: "babysitting",
    label: "Babysitting",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <path
          d="M29.9922 9.74337C29.5797 9.74899 29.1438 9.87837 28.8156 10.064C28.2297 10.3931 27.7375 11.4102 27.4563 12.0848C27.0181 11.8361 26.5535 11.6908 26.1075 11.6632C25.6615 11.6356 25.2493 11.7266 24.911 11.9273L29.0735 16.0935C29.2746 15.7546 29.3657 15.3416 29.3378 14.8947C29.3099 14.4478 29.1639 13.9823 28.9141 13.5435C29.5891 13.267 30.6063 12.7692 30.9344 12.1856C31.286 11.571 31.436 10.5646 30.9344 10.064C30.7 9.82962 30.3578 9.73821 29.9922 9.74337ZM24.0438 12.2521L22.5156 13.7779L27.2219 18.4842L28.75 16.9607L24.0438 12.2521ZM21.1844 14.2467C20.5516 14.2326 19.6422 14.5279 18.5078 15.667L10.0197 24.156C9.85376 24.3201 9.74548 24.6107 9.74548 24.9154C9.74548 25.2201 9.85376 25.5107 10.0197 25.6748L15.325 30.981C15.4891 31.1498 15.7797 31.2576 16.0891 31.2576C16.3938 31.2576 16.6844 31.1498 16.8485 30.981L17.0781 30.7467L15.7891 29.4576L16.3891 28.8576L17.6781 30.1467L18.6672 29.1576L17.3781 27.8685L17.9781 27.2685L19.2672 28.5576L20.261 27.5685L17.9078 25.2154L18.5078 24.6154L20.861 26.9685L21.85 25.9748L20.561 24.6857L21.161 24.0857L22.45 25.3748L23.4438 24.3857L22.15 23.092L22.75 22.492L24.0438 23.7857L25.0328 22.792L22.6797 20.4435L23.2797 19.8435L25.6235 22.1826C27.2922 20.3451 26.7063 19.1592 26.3922 18.8498L22.15 14.6076C22.0047 14.4623 21.6766 14.2607 21.1844 14.2467Z"
          fill="#041133"
        />
      </svg>
    ),
  },
  {
    id: "petsitter",
    label: "Petsitter",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <g clip-path="url(#clip0_22662_34181)">
          <path
            d="M17.2499 10.25C17.9349 10.25 18.5634 10.506 19.0209 10.979C19.4784 11.4525 19.7499 12.1285 19.7499 12.944C19.7499 13.7555 19.4819 14.57 19.0449 15.1865C18.6099 15.8 17.9799 16.25 17.2499 16.25C16.5199 16.25 15.8899 15.8 15.4549 15.1865C15.0179 14.57 14.7499 13.7555 14.7499 12.9445C14.7499 12.1285 15.0214 11.4525 15.4794 10.979C15.9364 10.506 16.5649 10.25 17.2499 10.25ZM11.7499 14.75C12.4349 14.75 13.0634 15.006 13.5209 15.479C13.9784 15.9525 14.2499 16.6285 14.2499 17.444C14.2499 18.2555 13.9819 19.07 13.5449 19.6865C13.1099 20.3 12.4799 20.75 11.7499 20.75C11.0199 20.75 10.3899 20.3 9.95494 19.6865C9.51794 19.07 9.24994 18.255 9.24994 17.4445C9.24994 16.6285 9.52144 15.9525 9.97944 15.479C10.4364 15.006 11.0649 14.75 11.7499 14.75ZM20.4999 18.25C16.9379 18.25 13.9869 21.2825 13.0579 25.085C12.6459 26.772 13.2744 28.5815 14.8244 29.439C16.0559 30.121 17.8989 30.75 20.4994 30.75C23.1004 30.75 24.9434 30.121 26.1754 29.439C27.7249 28.5815 28.3534 26.772 27.9414 25.0855C27.0129 21.2825 24.0614 18.25 20.4999 18.25ZM29.2499 14.75C28.5649 14.75 27.9364 15.006 27.4794 15.479C27.0214 15.9525 26.7499 16.6285 26.7499 17.444C26.7499 18.2555 27.0179 19.07 27.4549 19.6865C27.8899 20.3 28.5199 20.75 29.2499 20.75C29.9799 20.75 30.6099 20.3 31.0449 19.6865C31.4819 19.07 31.7499 18.2555 31.7499 17.4445C31.7499 16.6285 31.4784 15.9525 31.0209 15.479C30.5634 15.006 29.9349 14.75 29.2499 14.75ZM23.7499 10.25C23.0649 10.25 22.4364 10.506 21.9794 10.979C21.5214 11.4525 21.2499 12.1285 21.2499 12.944C21.2499 13.7555 21.5179 14.57 21.9549 15.1865C22.3899 15.8 23.0199 16.25 23.7499 16.25C24.4799 16.25 25.1099 15.8 25.5449 15.1865C25.9819 14.57 26.2499 13.7555 26.2499 12.9445C26.2499 12.1285 25.9784 11.4525 25.5209 10.979C25.0634 10.506 24.4349 10.25 23.7499 10.25Z"
            fill="#041133"
          />
        </g>
        <defs>
          <clipPath id="clip0_22662_34181">
            <rect
              width="24"
              height="24"
              fill="white"
              transform="translate(8.49994 8.5)"
            />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    id: "handyman",
    label: "Handyman",
    icon: (
      <svg
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="41" height="41" rx="20.5" fill="white" />
        <path
          d="M30.17 26.6704L25.45 21.9504C24.97 21.4704 24.46 21.3604 23.87 21.3604L21.33 23.9004C21.33 24.4904 21.44 25.0104 21.92 25.4804L26.64 30.2004C27.03 30.5904 27.66 30.5904 28.05 30.2004L30.17 28.0804C30.2627 27.9878 30.3363 27.8779 30.3864 27.757C30.4366 27.636 30.4625 27.5063 30.4625 27.3754C30.4625 27.2444 30.4366 27.1147 30.3864 26.9937C30.3363 26.8728 30.2627 26.7629 30.17 26.6704Z"
          fill="#041133"
        />
        <path
          d="M25.13 17.9904C25.52 18.3804 26.15 18.3804 26.54 17.9904L27.25 17.2804L29.37 19.4004C29.9318 18.8379 30.2474 18.0754 30.2474 17.2804C30.2474 16.4854 29.9318 15.7229 29.37 15.1604L26.54 12.3304C26.4475 12.2377 26.3376 12.1642 26.2166 12.114C26.0957 12.0638 25.966 12.038 25.835 12.038C25.704 12.038 25.5744 12.0638 25.4534 12.114C25.3324 12.1642 25.2225 12.2377 25.13 12.3304L24.42 13.0404V10.5004C24.42 9.88043 23.66 9.55043 23.21 10.0004L20.67 12.5404C20.22 12.9904 20.55 13.7504 21.17 13.7504H23.71L23 14.4604C22.9073 14.5529 22.8338 14.6628 22.7836 14.7838C22.7334 14.9048 22.7076 15.0345 22.7076 15.1654C22.7076 15.2964 22.7334 15.4261 22.7836 15.5471C22.8338 15.668 22.9073 15.7779 23 15.8704L23.35 16.2204L20.46 19.1104L16.35 14.9804V13.9804C16.35 13.7104 16.24 13.4604 16.06 13.2704L14.04 11.2404C13.9475 11.1477 13.8376 11.0742 13.7166 11.024C13.5957 10.9738 13.466 10.948 13.335 10.948C13.204 10.948 13.0744 10.9738 12.9534 11.024C12.8324 11.0742 12.7225 11.1477 12.63 11.2404L11.21 12.6604C11.1173 12.7529 11.0438 12.8628 10.9936 12.9838C10.9434 13.1048 10.9176 13.2345 10.9176 13.3654C10.9176 13.4964 10.9434 13.6261 10.9936 13.7471C11.0438 13.868 11.1173 13.9779 11.21 14.0704L13.23 16.1004C13.42 16.2904 13.67 16.3904 13.94 16.3904H14.94L19.07 20.5204L18.22 21.3704H16.92C16.39 21.3704 15.88 21.5804 15.51 21.9604L10.79 26.6804C10.6973 26.7729 10.6238 26.8828 10.5736 27.0038C10.5234 27.1248 10.4976 27.2545 10.4976 27.3854C10.4976 27.5164 10.5234 27.6461 10.5736 27.7671C10.6238 27.888 10.6973 27.9979 10.79 28.0904L12.91 30.2104C13.3 30.6004 13.93 30.6004 14.32 30.2104L19.04 25.4904C19.42 25.1104 19.63 24.6104 19.63 24.0804V22.7904L24.78 17.6404L25.13 17.9904Z"
          fill="#041133"
        />
      </svg>
    ),
  },
];

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center rounded-[8px] px-4 text-left text-[14px] font-semibold",
        "transition focus:outline-none focus:ring-2 focus:ring-[#071B58]/20",
        active
          ? "border border-[#D0D5DD] bg-[#F2F4F7] text-[#0F172A]"
          : "border border-transparent bg-white text-[#98A2B3] hover:bg-[#F8FAFC] hover:text-[#344054]",
      )}
    >
      {children}
    </button>
  );
}

function SettingsSidePanel({
  activeTab,
  onSelectTab,
  onLogout,
}: {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-full max-w-[260px] rounded-[14px] border border-[#EAECF0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="space-y-2">
        <TabButton
          active={activeTab === "integrations"}
          onClick={() => onSelectTab("integrations")}
        >
          - Integrations
        </TabButton>
        <TabButton
          active={activeTab === "security"}
          onClick={() => onSelectTab("security")}
        >
          - Security
        </TabButton>
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-[8px] border border-transparent bg-white px-4 text-left text-[14px] font-semibold text-[#F04438]",
            "transition hover:bg-[#FEF3F2] focus:outline-none focus:ring-2 focus:ring-[#F04438]/20",
          )}
          aria-label="Log out"
        >
          <span>→ Log-Out</span>
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function IntegrationsTab({
  searchValue,
  onSearchChange,
  integrations,
  onToggleIntegration,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  integrations: Array<{
    id: IntegrationToggleId;
    label: string;
    icon: React.ReactNode;
    checked: boolean;
  }>;
  onToggleIntegration: (id: IntegrationToggleId, checked: boolean) => void;
}) {
  return (
    <section className="rounded-[14px] border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-6">
      <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828]">
        Services Intergration
      </h2>

      <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#F2F4F7] px-3 py-2 text-[12px] leading-4 text-[#475467]">
        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#101828] text-white">
          <Info className="h-5 w-5" aria-hidden="true" />
        </span>
        <p>
          Note that toggling off any of these integrations means that , it won’t
          be available for use on Aidsprint until it is toggled back on from
          here
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="integration-search" className="sr-only">
          Search integrations
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]"
            aria-hidden="true"
          />
          <input
            id="integration-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            className={cn(
              "h-11 w-full rounded-[10px] border border-[#EAECF0] bg-white pl-9 pr-3 text-[12px] text-[#101828]",
              "placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20",
            )}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {integrations.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#D0D5DD] p-6 text-center">
            <p className="text-[14px] font-medium text-[#667085]">
              No integrations match your search.
            </p>
          </div>
        ) : (
          integrations.map((integration) => (
            <IntegrationToggle
              key={integration.id}
              id={integration.id}
              label={integration.label}
              icon={integration.icon}
              checked={integration.checked}
              onCheckedChange={(checked) =>
                onToggleIntegration(integration.id, checked)
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function SecurityTab({
  onSubmit,
}: {
  onSubmit: (values: SecurityFormValues) => void;
}) {
  return (
    <section className="rounded-[14px] border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-6">
      <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828]">
        Security
      </h2>
      <div className="mt-4 max-w-[560px]">
        <SecurityForm onSubmit={onSubmit} />
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("integrations");
  const [searchValue, setSearchValue] = useState("");
  const [integrationState, setIntegrationState] = useState<
    Record<IntegrationToggleId, boolean>
  >(() =>
    integrationsCatalog.reduce(
      (acc, item) => {
        acc[item.id] = true;
        return acc;
      },
      {} as Record<IntegrationToggleId, boolean>,
    ),
  );

  const integrations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const records = integrationsCatalog.map((item) => ({
      ...item,
      checked: integrationState[item.id],
    }));

    if (!query) return records;
    return records.filter((item) => item.label.toLowerCase().includes(query));
  }, [integrationState, searchValue]);

  const handleLogout = () => {
    toast.success("Logged out", {
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const handleToggleIntegration = (
    id: IntegrationToggleId,
    checked: boolean,
  ) => {
    setIntegrationState((previous) => ({ ...previous, [id]: checked }));
    const label =
      integrationsCatalog.find((entry) => entry.id === id)?.label ??
      "Integration";
    toast.success("Integration updated", {
      description: `${label} is now ${checked ? "enabled" : "disabled"}.`,
    });
  };

  const handleSubmitSecurity = (_values: SecurityFormValues) => {
    toast.success("Password updated", {
      description: "Your password has been updated successfully.",
    });
  };

  return (
    <DashboardLayout title="Settings">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <SettingsSidePanel
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSearchValue("");
          }}
          onLogout={handleLogout}
        />

        <div className="rounded-[14px] border border-[#EAECF0] bg-[#F9FAFB] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#475467]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F2F4F7] text-[#344054]">
                <Info className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>Changes are applied immediately.</span>
            </div>
          </div>

          <div className="mt-4">
            {activeTab === "integrations" ? (
              <IntegrationsTab
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                integrations={integrations}
                onToggleIntegration={handleToggleIntegration}
              />
            ) : (
              <SecurityTab onSubmit={handleSubmitSecurity} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
