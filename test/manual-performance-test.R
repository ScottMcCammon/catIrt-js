# R-equivalent to "manual-performance-test.js" for performance comparison
#
# run via: R --no-save < manual-performance-test.R

library(catIrt)
load(file="../data/mocca-items.RData") # creates "itembank" var
respbank <- c(1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3)

resp2binary <- function(x) if (x == 2) 1 else 0

begTime <- Sys.time()
i <- 1
while (TRUE) {
  # create 1-40 random responses and items
  rows <- sample(nrow(itembank))
  itembank <- itembank[rows,]
  n <- sample(1:40, 1)
  resp <- sample(respbank, n)
  useditems <- itembank[1:n,, drop=FALSE]
  fromitems <- itembank[-(1:n),]

  # theta1 scoring
  res <- wleEst(sapply(resp, resp2binary), useditems[,2:4], mod="brm")

  # phase1 item selection
  if (n <= 20) {
    sel <- itChoose(fromitems[,1:4], mod="brm", select="UW-FI", at="theta", cat_theta=res$theta)
  }

  # theta2 scoring
  res <- wleEst(resp, useditems[,5:7], mod="grm")

  # phase2 item selection
  if (n > 20) {
    sel <- itChoose(cbind(useditems[,1], useditems[,5:7]), mod="grm", select="UW-FI", at="theta", cat_theta=res$theta)
  }

  # performance metrics
  if ((i %% 10000) == 0) {
    endTime <- Sys.time()
    print(paste0("iteration ", i, ": rate: ", floor(i / as.numeric(endTime - begTime, units="secs")), " iter/s"))
  }

  i <- i + 1
}
